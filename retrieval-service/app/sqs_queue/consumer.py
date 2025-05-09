import aioboto3
import logging

from config import AWS_REGION, SQS_MESSAGE_GENERATION_QUEUE_URL
from services.email_generation import email_generation
from models.models import EmailGenerationMessage

class EmailCreationConsumer():
  def __init__(self):
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
                  logging.info(f"Received message for thread_id: {message_obj.thread_id}. Starting to handle reply.")
                  
                  await email_generation.handle_reply(message_obj)
                else:
                  logging.info(f"Received message for lead_id: {message_obj.lead_id}. Starting to handle outgoing.")
                  
                  await email_generation.handle_outgoing(message_obj)
                
                # Delete message before processing
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

email_creation_consumer = EmailCreationConsumer()