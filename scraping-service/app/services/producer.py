import json
import logging
import aioboto3
import uuid

from config.config import SQS_EMBEDDING_QUEUE_URL, AWS_REGION

logging.basicConfig(level=logging.INFO)

class SQSproducer:
    """SQS Producer for sending chunked text messages."""
    
    def __init__(self):
        self.session = aioboto3.Session()
        self.sqs_client = None

    async def initialize(self):
        self.sqs_client = await self.session.client("sqs", region_name=AWS_REGION).__aenter__()
        
        logging.info("SQS EmbeddingQueue initialized.")

    async def send_message(self, message: dict):
        try:
            await self.sqs_client.send_message(
                QueueUrl=SQS_EMBEDDING_QUEUE_URL,
                MessageBody=json.dumps(message),
                MessageGroupId=f"chunk-to-embed",
                MessageDeduplicationId=str(uuid.uuid4())
            )
            
            logging.info(f"SQS message sent: {message}")
        except Exception as e:
            logging.exception("Failed to send message to SQS")

    async def stop(self):
        if self.sqs_client:
            await self.sqs_client.__aexit__(None, None, None)
            logging.info("SQS EmbeddingQueue stopped.")

# Create a global instance
sqs_producer = SQSproducer()
