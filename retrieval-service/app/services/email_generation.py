import logging
from openai import AsyncOpenAI


from prompts.openai_prompts import top_level_system_prompt, outgoing_user_prompt, top_level_system_prompt, reply_user_prompt
from sqs_queue.producer import email_producer
from services.retriever import retriever
from models.models import EmailGenerationMessage

class EmailGeneration():
  def __init__(self):
    self.openai_client = AsyncOpenAI()
    self.openai_model = "gpt-4o"

  async def _generate_outgoing(self, first_name, last_name, campaign_goal, campaign_system_prompt) -> str:
    '''
    Function to generate an outgoing email
    '''
    
    user_outgoing_prompt = outgoing_user_prompt.format(first_name=first_name, last_name=last_name, campaign_goal=campaign_goal)
    messages = [
      {
        "role": "system",
        "content": top_level_system_prompt
      }]
    
    if campaign_system_prompt:
      messages.append({
        "role": "user",
        "content": campaign_system_prompt
      })
      
    messages.append({
        "role": "user",
        "content": user_outgoing_prompt
    })
    
    completion = await self.openai_client.chat.completions.create(
    model=self.openai_model,
    messages=messages)
        
    generated_outgoing = completion.choices[0].message.content
    
    return generated_outgoing
  

  async def _generate_reply(self, first_name, last_name, campaign_goal, thread, last_message, retrieved_info, campaign_system_prompt) -> str:
    '''
    Function to generate a reply to an email
    '''
    # TODO: Use the retrieved info to generate a reply
    
    user_reply_prompt = reply_user_prompt.format(first_name=first_name, last_name=last_name, campaign_goal=campaign_goal, thread=thread, last_message=last_message, retrieved_info=retrieved_info)
    messages = [
      {
        "role": "system",
        "content": top_level_system_prompt
      }
    ]
    
    if campaign_system_prompt:
      messages.append({
        "role": "user",
        "content": campaign_system_prompt
      })
      
    messages.append({
        "role": "user",
        "content": user_reply_prompt
    })
    
    completion = await self.openai_client.chat.completions.create(
      model=self.openai_model,
      messages=messages
    )
    generated_reply = completion.choices[0].message.content
    
    return generated_reply
  
  async def _generate_subject(self, email_body: str) -> str:
    '''
    Function to generate a subject line for the email
    '''
    user_subject_prompt = f"Generate a subject line for the following email: {email_body}"
    messages = [
      {
        "role": "system",
        "content": top_level_system_prompt
      },
      {
        "role": "user",
        "content": user_subject_prompt
      }
    ]
    completion = await self.openai_client.chat.completions.create(
      model=self.openai_model,
      messages=messages
    )
    generated_subject = completion.choices[0].message.content
    
    return generated_subject

  '''
  Function to handle the outgoing email generation
  '''
  async def handle_outgoing(self, message: EmailGenerationMessage):
    campaign_id = message.campaign_id
    lead_id = message.lead_id
    campaign_goal = message.campaign_goal
    first_name = message.first_name
    last_name = message.last_name
    campaign_system_prompt = message.campaign_system_prompt
    generated_outgoing = await self._generate_outgoing(first_name, last_name, campaign_goal, campaign_system_prompt)
    generated_subject = await self._generate_subject(generated_outgoing)

    send_email_payload = {
        "campaign_id": campaign_id,
        "lead_id": lead_id,
        "subject": generated_subject,
        "body": generated_outgoing
    }

    await email_producer.send_email_payload(send_email_payload)

    print(f"Sent outgoing email payload to send-email queue: {send_email_payload}")
  
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
    last_message = message.last_message
    campaign_system_prompt = message.campaign_system_prompt

    retrieved_info = await retriever.retrieve(last_message, thread)
    # Generated reply email
    generated_reply = await self._generate_reply(first_name, last_name, campaign_goal, thread, last_message, retrieved_info, campaign_system_prompt)
    #generated_subject = await self._generate_subject(generated_reply)
    
    send_email_payload = {
      'campaign_id': campaign_id,
      'lead_id': lead_id,
      'thread_id': thread_id,
      'message_id': message_id,
      #'subject': generated_subject,
      'body': generated_reply
    }
    
    await email_producer.send_email_payload(send_email_payload)
    print(f"Sent reply email payload to send-email queue: {send_email_payload}")

email_generation = EmailGeneration()