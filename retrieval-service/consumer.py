import aioboto3

import logging
from openai import AsyncOpenAI
from pydantic import BaseModel
from typing import Optional

from config import KAFKA_BROKER, KAFKA_GROUP_ID, EMAIL_GENERATION_TOPIC, AWS_REGION, SQS_MESSAGE_GENERATION_QUEUE_URL
from openai_prompts import outgoing_system_prompt, outgoing_user_prompt, reply_system_prompt, reply_user_prompt
from producer import email_producer
from vector_db_retriever import fetch_related_info_from_vector_db_based_on_last_message

# Interface for a received email generation message 
class EmailGenerationMessage(BaseModel):
  campaign_id: int
  lead_id: int
  campaign_goal: str
  first_name: str
  last_name: str
  thread_id: Optional[str] = None
  thread: Optional[str] = None
  last_message: Optional[str] = None
  message_id: Optional[str] = None

class EmailCreationConsumer():
  def __init__(self):
    self.client = AsyncOpenAI()
    self.model = "gpt-4o"
    self.aioboto_session = aioboto3.Session()
    self.aws_region = AWS_REGION
    self.sqs_message_generation_queue_url = SQS_MESSAGE_GENERATION_QUEUE_URL

  '''
  Function to consume messages from the queue for email generation
  '''
  async def consume(self):
    try:
      logging.info("Starting email generation consumer...")
      
      async with self.aioboto_session.client("sqs", region_name = self.aws_region) as sqs:
        while True:
          try:
            response = await sqs.receive_message(
              QueueUrl=self.sqs_message_generation_queue_url,
              MaxNumberOfMessages=10,
              WaitTimeSeconds=20,  # long polling
              MessageAttributeNames=["All"],
            )
            messages = response.get('Messages', [])

            for msg in messages:
              body = msg["Body"]
              try:
                message_obj = EmailGenerationMessage.parse_raw(body)
                if message_obj.thread_id or message_obj.thread:
                  await self.handle_reply(message_obj)
                else:
                  await self.handle_outgoing(message_obj)
                
                # Delete message after processing
                await sqs.delete_message(
                  QueueUrl=self.sqs_message_generation_queue_url,
                  ReceiptHandle=msg["ReceiptHandle"]
                )
              except Exception as e:
                  logging.exception(f"Error handling message: {e}")

          except Exception as e:
              logging.exception(f"Error receiving messages: {e}")

    except Exception as e:
      logging.exception(f"Error starting consumer: {e}")
    
  async def get_last_message_from_the_thread(self, thread: str):
    system_message = 'Your goal is to extract the last message from the email thread. THE LAST MESSAGE appears at the beginning of the thread.'
    user_message = f'Extract the last message from the thread: {thread}'
    completion = await self.client.chat.completions.create(
    model=self.model,
    messages=[
        {
            "role": "system",
            "content": system_message
        },
        {
            "role": "user",
            "content": user_message
        }
    ])
    last_message = completion.choices[0].message.content

    return last_message

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
    # TODO: Use the retrieved info to generate a reply
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
    last_message = await self.get_last_message_from_the_thread(thread)
    message_id = message.message_id
    # TODO: Retrieve info relevant to the last message from the vector db
    retrieved_info = await fetch_related_info_from_vector_db_based_on_last_message(last_message)
    # Generated reply email
    generated_reply = await self.generate_reply(first_name, last_name, campaign_goal, thread, last_message, retrieved_info)
    
    send_email_payload = {
      'campaign_id': campaign_id,
      'lead_id': lead_id,
      'thread_id': thread_id,
      'message_id': message_id,
      'subject': "Re: Let's connect!",
      'body': generated_reply
    }
    
    await email_producer.send_email_payload(send_email_payload)
    print(f"✅ Sent reply email payload to send-email topic: {send_email_payload}")
    
email_creation_consumer = EmailCreationConsumer()