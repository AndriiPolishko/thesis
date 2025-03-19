import json
import logging
from aiokafka import AIOKafkaConsumer

from config import KAFKA_BROKER, KAFKA_TOPIC, KAFKA_GROUP_ID



async def consume():
    """Consumes messages from Kafka and processes URLs."""

    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BROKER,
        group_id=KAFKA_GROUP_ID,
        auto_offset_reset="earliest"
    )

    await consumer.start()
    logging.info("Kafka consumer started")

    async for msg in consumer:
        message_str = msg.value.decode()

        try:
            message_obj = json.loads(message_str)
            
            print(message_obj)
           

        except json.JSONDecodeError:
            logging.error(f"Error decoding message: {message_str}")

async def stop_consumer():
    """Stops the Kafka consumer gracefully."""
    global consumer
    if consumer:
        logging.info("🔄 Stopping Kafka consumer...")

        await consumer.stop()

        logging.info("✅ Kafka consumer stopped.")