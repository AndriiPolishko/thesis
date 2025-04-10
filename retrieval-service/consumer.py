import json
import logging
from openai import AsyncOpenAI
from aiokafka import AIOKafkaConsumer
from pydantic import BaseModel
from typing import Optional

from config import KAFKA_BROKER, KAFKA_GROUP_ID, EMAIL_GENERATION_TOPIC
from openai_prompts import outgoing_system_prompt, outgoing_user_prompt, reply_system_prompt, reply_user_prompt
from producer import email_producer

# Interface for a received email generation message 
class EmailGenerationMessage(BaseModel):
  campaign_id: str
  lead_id: str
  campaign_goal: str
  first_name: str
  last_name: str
  thread_id: Optional[str] = None
  thread: Optional[str] = None
  last_message: Optional[str] = None

class EmailCreationConsumer():
  def __init__(self):
    self.consumer = None
    self.is_running = False
    self.client = AsyncOpenAI()
    self.model = "gpt-4o"
  
  '''
  Function to initialize the consumer
  '''
  async def initialize(self):
    self.consumer = AIOKafkaConsumer(
      EMAIL_GENERATION_TOPIC,
      bootstrap_servers=KAFKA_BROKER,
      group_id=KAFKA_GROUP_ID,
      auto_offset_reset="earliest"
    )
    self.is_running = True
    
    await self.consumer.start()
  
  '''
  Function to generate an outgoing email
  '''
  async def generate_outgoing(self, first_name, last_name, campaign_goal) -> str:
    user_outgoing_prompt = outgoing_user_prompt.format(first_name=first_name, last_name=last_name, campaign_goal=campaign_goal)
    completion = await self.client.chat.completions.create(
    model=self.model,
    messages=[
        {
            "role": "system",
            "content": outgoing_system_prompt
        },
        {
            "role": "user",
            "content": user_outgoing_prompt
        }
    ])
        
    generated_outgoing = completion.choices[0].message.content
    
    return generated_outgoing
  
  '''
  Function to generate a reply to an email
  '''
  async def generate_reply(self, first_name, last_name, campaign_goal, thread, last_message, retrieved_info) -> str:
    user_reply_prompt = reply_user_prompt.format(first_name=first_name, last_name=last_name, campaign_goal=campaign_goal, thread=thread, last_message=last_message, retrieved_info=retrieved_info)
    completion = await self.client.chat.completions.create(
    model=self.model,
    messages=[
        {
            "role": "system",
            "content": reply_system_prompt
        },
        {
            "role": "user",
            "content": user_reply_prompt
        }
    ])
    generated_reply = completion.choices[0].message.content
    
    return generated_reply
  
  '''
  Function to consume messages from the queue for email generation
  '''
  async def consume(self):
    if not self.is_running:
      await self.initialize()
    
    while self.is_running:
      try:
        messages_batch = await self.consumer.getmany(timeout_ms=1000)
        for _, messages in messages_batch.items():
          for message in messages:
            message_str = message.value.decode()
            print(f"Received message: {message.value.decode()}")
            try:
              message_obj = EmailGenerationMessage.model_validate_json(message_str) # json.loads(message_str)
              thread_id = message_obj.thread_id

              # In case we received thread id, it means we need to generated a reply
              if thread_id:
                self.handle_reply(message_obj)
              
              self.handle_outgoing(message_obj)

            except Exception as e:
              logging.error(f"Error parsing message: {e}")
              continue
        
      except Exception as e:
        logging.error(f"Error consuming message: {e}")
  
  '''
  Function to stop the consumer
  '''
  async def stop(self):
    if self.is_running:
      self.is_running = False
      await self.consumer.stop()
      self.consumer = None
  
  '''
  Function to handle the outgoing email generation
  '''
  async def handle_outgoing(self, message: EmailGenerationMessage):
    campaign_id = message.campaign_id
    lead_id = message.lead_id
    campaign_goal = message.campaign_goal
    first_name = message.first_name
    last_name = message.last_name
    # Generated outgoing email
    generated_outgoing = await self.generate_outgoing(first_name, last_name, campaign_goal)

    send_email_payload = {
        "campaign_id": campaign_id,
        "lead_id": lead_id,
        # TODO: generate subject
        "subject": "Let's connect!",
        "body": generated_outgoing
    }

    await email_producer.send_email_payload(send_email_payload)
    print(f"✅ Sent outgoing email payload to send-email topic: {send_email_payload}")
  
  '''
  Function to handle the reply email generation
  '''
  async def handle_reply(self, message: EmailGenerationMessage):
    campaign_id = message.campaign_id
    lead_id = message.lead_id
    thread_id = message.thread_id
    thread = message.thread
    campaign_goal = message.campaign_goal
    first_name = message.first_name
    last_name = message.last_name
    last_message = message.last_message
    # TODO: Retrieve info relevant to the last message from the vector db
    retrieved_info = "This is some retrieved info"
    # Generated reply email
    generated_reply = await self.generate_reply(first_name, last_name, campaign_goal, thread, last_message, retrieved_info)
    
    send_email_payload = {
      'campaign_id': campaign_id,
      'lead_id': lead_id,
      'thread_id': thread_id,
      'subject': "Re: Let's connect!",
      'body': generated_reply
    }
    
    await email_producer.send_email_payload(send_email_payload)
    print(f"✅ Sent reply email payload to send-email topic: {send_email_payload}")
    
email_creation_consumer = EmailCreationConsumer()