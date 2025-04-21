import logging
from openai import AsyncOpenAI
from pydantic import BaseModel
from typing import Optional

from prompts.openai_prompts import outgoing_system_prompt, outgoing_user_prompt, reply_system_prompt, reply_user_prompt
from sqs_queue.producer import email_producer
from services.retriever import retriever

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

class EmailGeneration():
  def __init__(self):
    self.openai_client = AsyncOpenAI()
    self.openai_model = "gpt-4o"

    
  async def _get_last_message_from_the_thread(self, thread: str):
    system_message = 'Your goal is to extract the last message from the email thread. THE LAST MESSAGE appears at the beginning of the thread.'
    user_message = f'Extract the last message from the thread: {thread}'
    completion = await self.openai_client.chat.completions.create(
    model=self.openai_model,
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


  async def _generate_outgoing(self, first_name, last_name, campaign_goal) -> str:
    '''
    Function to generate an outgoing email
    '''
    
    user_outgoing_prompt = outgoing_user_prompt.format(first_name=first_name, last_name=last_name, campaign_goal=campaign_goal)
    completion = await self.openai_client.chat.completions.create(
    model=self.openai_model,
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
  

  async def _generate_reply(self, first_name, last_name, campaign_goal, thread, last_message, retrieved_info) -> str:
    '''
    Function to generate a reply to an email
    '''
    # TODO: Use the retrieved info to generate a reply
    
    user_reply_prompt = reply_user_prompt.format(first_name=first_name, last_name=last_name, campaign_goal=campaign_goal, thread=thread, last_message=last_message, retrieved_info=retrieved_info)
    completion = await self.openai_client.chat.completions.create(
      model=self.openai_model,
      messages=[
          {
              "role": "system",
              "content": reply_system_prompt
          },
          {
              "role": "user",
              "content": user_reply_prompt
          }
      ]
    )
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
    generated_outgoing = await self._generate_outgoing(first_name, last_name, campaign_goal)

    send_email_payload = {
        "campaign_id": campaign_id,
        "lead_id": lead_id,
        # TODO: generate subject
        "subject": "Let's connect!",
        "body": generated_outgoing
    }

    await email_producer.send_email_payload(send_email_payload)
    print(f"✅ Sent outgoing email payload to send-email queue: {send_email_payload}")
  
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
    message_id = message.message_id
  
    last_message = await self._get_last_message_from_the_thread(thread)

    retrieved_info = await retriever.retrieve(last_message, thread)
    # Generated reply email
    generated_reply = await self._generate_reply(first_name, last_name, campaign_goal, thread, last_message, retrieved_info)
    
    send_email_payload = {
      'campaign_id': campaign_id,
      'lead_id': lead_id,
      'thread_id': thread_id,
      'message_id': message_id,
      'subject': "Re: Let's connect!",
      'body': generated_reply
    }
    
    await email_producer.send_email_payload(send_email_payload)
    print(f"✅ Sent reply email payload to send-email queue: {send_email_payload}")

email_generation = EmailGeneration()