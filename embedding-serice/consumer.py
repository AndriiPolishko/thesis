import asyncio
import json
import logging
from aiokafka import AIOKafkaConsumer
from redis import Redis

from config import KAFKA_BROKER, KAFKA_TOPIC, KAFKA_GROUP_ID
from embedding import embedding_class
from db import database

redis = Redis(host="localhost", port=6379, decode_responses=True)

class ChunksConsumer:
    def __init__(self):
        self.consumer = None
        self.running = False

    async def initialize(self):
        if self.consumer is None:
            self.consumer = AIOKafkaConsumer(
                KAFKA_TOPIC,
                bootstrap_servers=KAFKA_BROKER,
                group_id=KAFKA_GROUP_ID,
                auto_offset_reset="earliest"
            )
            await self.consumer.start()
            self.running = True
            logging.info("Kafka consumer initialized")

    async def consume(self):
        """Consumes messages from Kafka and processes URLs."""
        if self.consumer is None:
            await self.initialize()

        logging.info("Consumer loop starting...")
        try:
            while self.running:
                try:
                    # Use a timeout to make the loop interruptible
                    batch = await self.consumer.getmany(timeout_ms=1000)
                    for tp, messages in batch.items():
                        for msg in messages:
                            message_str = msg.value.decode()
                            try:
                                message_obj = json.loads(message_str)
                                link_id = message_obj["link_id"]
                                chunk = message_obj["chunk"]
                                campaign_id = message_obj["campaign_id"]
                                
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
                            except json.JSONDecodeError:
                                logging.error(f"Error decoding message: {message_str}")
                            except KeyError as e:
                                logging.error(f"Missing key in message: {e}")
                            except Exception as e:
                                logging.error(f"Error processing message: {e}")
                except asyncio.CancelledError:
                    logging.info("Consumer task cancelled")
                    break
                except Exception as e:
                    logging.error(f"Error in consumer loop: {e}")
                    # Add a small delay to prevent CPU spinning in case of errors
                    await asyncio.sleep(1)

        except asyncio.CancelledError:
            logging.info("Consumer task cancelled during processing")
        finally:
            logging.info("Consumer loop finished")

    async def stop_consumer(self):
        """Stops the Kafka consumer gracefully."""
        if self.consumer is not None:
            logging.info("🔄 Stopping Kafka consumer...")
            self.running = False
            await self.consumer.stop()
            self.consumer = None
            logging.info("✅ Kafka consumer stopped.")

chunks_consumer = ChunksConsumer()