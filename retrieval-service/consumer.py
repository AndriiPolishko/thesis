import json
import logging
from openai import AsyncOpenAI
from aiokafka import AIOKafkaConsumer

from config import KAFKA_BROKER, KAFKA_GROUP_ID, EMAIL_GENERATION_TOPIC
from openaiprompts import outgoing_system_prompt, outgoing_user_prompt
from producer import email_producer

class EmailCreationConsumer():
  def __init__(self):
    self.consumer = None
    self.is_running = False
    self.client = AsyncOpenAI()
    self.model = "gpt-4o"
  
  async def initialize(self):
    self.consumer = AIOKafkaConsumer(
      EMAIL_GENERATION_TOPIC,
      bootstrap_servers=KAFKA_BROKER,
      group_id=KAFKA_GROUP_ID,
      auto_offset_reset="earliest"
    )
    self.is_running = True
    
    await self.consumer.start()
  
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
              message_obj = json.loads(message_str)
              campaign_id = message_obj.get("campaign_id")
              lead_id = message_obj.get("lead_id")
              campaign_goal = message_obj.get("campaign_goal")
              first_name = message_obj.get("first_name")
              last_name = message_obj.get("last_name")
              # Generated outgoing email
              generated_outgoing = await self.generate_outgoing(first_name, last_name, campaign_goal)
              
              print(f'Test {campaign_id} {lead_id} {campaign_goal} {first_name} {last_name}')
              print(f'GENERATED outgoing email: {generated_outgoing}')
              
              generated_outgoing = await self.generate_outgoing(first_name, last_name, campaign_goal)

              send_email_payload = {
                  "campaign_id": campaign_id,
                  "lead_id": lead_id,
                  # TODO: generate subject
                  "subject": "Let's connect!",
                  "body": generated_outgoing
              }

              await email_producer.send_email_payload(send_email_payload)
              print(f"✅ Sent email payload to send-email topic: {send_email_payload}")

            except Exception as e:
              logging.error(f"Error parsing message: {e}")
              continue
        
      except Exception as e:
        logging.error(f"Error consuming message: {e}")
  
  async def stop(self):
    if self.is_running:
      self.is_running = False
      await self.consumer.stop()
      self.consumer = None

email_creation_consumer = EmailCreationConsumer()