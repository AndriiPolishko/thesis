import aioboto3
import json
import uuid
import logging

from config import AWS_REGION, SQS_GENERATED_MESSAGE_QUEUE_URL

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

class EmailProducer:
    def __init__(self):
        self.session = aioboto3.Session()
        self.sqs_client = None

    async def initialize(self):
        self.sqs_client = await self.session.client("sqs", region_name=AWS_REGION).__aenter__()
        logging.info("SQS EmailProducer initialized.")

    async def stop(self):
        if self.sqs_client:
            await self.sqs_client.__aexit__(None, None, None)
            logging.info("SQS EmailProducer stopped.")

    async def send_email_payload(self, payload: dict):
        if not self.sqs_client:
          await self.initialize()
      
        try:
            await self.sqs_client.send_message(
                QueueUrl=SQS_GENERATED_MESSAGE_QUEUE_URL,
                MessageBody=json.dumps(payload),
                MessageGroupId=f"generated_email"
            )
            
            logging.info(f"SQS message sent: {payload}")
        except Exception as e:
            logging.exception("Failed to send message to SQS")

email_producer = EmailProducer()