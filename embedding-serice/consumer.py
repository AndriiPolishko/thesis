import asyncio
import json
import logging
import aioboto3
from redis import Redis
from pydantic import BaseModel

from config import AWS_REGION, SQS_EMBEDDING_QUEUE_URL
from embedding import embedding_class
from db import database

redis = Redis(host="localhost", port=6379, decode_responses=True)

class EmbedChunkMessage(BaseModel):
    link_id: int
    chunk: str
    campaign_id: int

class ChunksConsumer:
    def __init__(self):
        self.aioboto_session = aioboto3.Session()
        self.aws_region = AWS_REGION
        self.sqs_embedding_queue_url = SQS_EMBEDDING_QUEUE_URL
        self.running = False

    async def consume(self):
        """Consumes messages from SQS and processes URLs."""
        logging.info("Consumer loop starting...")

        try:
            async with self.aioboto_session.client("sqs", region_name = self.aws_region) as sqs:
                while True:
                    try:
                        response = await sqs.receive_message(
                            QueueUrl=self.sqs_embedding_queue_url,
                            MaxNumberOfMessages=10,
                            WaitTimeSeconds=20,  # long polling
                            MessageAttributeNames=["All"],
                        )
                        messages = response.get('Messages', [])
                        
                        for msg in messages:
                            # Delete message before processing
                            await sqs.delete_message(
                                QueueUrl=self.sqs_embedding_queue_url,
                                ReceiptHandle=msg["ReceiptHandle"]
                            )
                            
                            body = msg["Body"]
                            message_obj = EmbedChunkMessage.parse_raw(body)
                            
                            try:
                                link_id = message_obj.link_id
                                chunk = message_obj.chunk
                                campaign_id = message_obj.campaign_id
                                
                                logging.info(f"Processing chunk for link_id: {link_id}")
                                
                                redis_campaign_chunks_key = f"campaign:{campaign_id}:chunks"
                                # Decrement the number of chunks left to process
                                redis.decr(redis_campaign_chunks_key)
                                
                                if int(redis.get(redis_campaign_chunks_key)) == 0:
                                    # All chunks have been processed
                                    redis.delete(redis_campaign_chunks_key)
                                    logging.info(f"All chunks processed for campaign_id: {campaign_id}")
                                    
                                    await database.mark_campaign_ready(campaign_id)
                                
                                chunk_embedding = embedding_class.get_embedded_text(chunk)
                                await database.insert_embedding(link_id, chunk, chunk_embedding)
                                logging.info(f"Successfully processed chunk for link_id: {link_id}")
                            except KeyError as e:
                                logging.error(f"Missing key in message: {e}")
                            except Exception as e:
                                logging.error(f"Error processing message: {e}")
                    except Exception as e:
                        logging.error(f"Error in consumer loop: {e}")
                        # Add a small delay to prevent CPU spinning in case of errors
                        await asyncio.sleep(1)

        except asyncio.CancelledError:
            logging.info("Consumer task cancelled during processing")
        finally:
            logging.info("Consumer loop finished")

chunks_consumer = ChunksConsumer()