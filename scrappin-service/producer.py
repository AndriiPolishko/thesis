import json
import logging
from aiokafka import AIOKafkaProducer
from config import KAFKA_BROKER, KAFKA_PRODUCER_TOPIC

logging.basicConfig(level=logging.INFO)

class KafkaProducerService:
    """Kafka Producer Service for sending chunked text messages."""
    
    def __init__(self):
        self.producer = None  # Will be initialized on startup

    async def start(self):
        """Starts the Kafka producer."""
        self.producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BROKER)
        await self.producer.start()
        logging.info("✅ Kafka producer started.")

    async def send_message(self, message: dict):
        """Sends a message to the Kafka topic."""
        if not self.producer:
            logging.error("❌ Kafka producer is not initialized.")
            return

        message_bytes = json.dumps(message).encode("utf-8")
        await self.producer.send(KAFKA_PRODUCER_TOPIC, message_bytes)
        logging.info(f"📨 Sent message: {message}")

    async def stop(self):
        """Stops the Kafka producer."""
        if self.producer:
            await self.producer.stop()
            logging.info("✅ Kafka producer stopped.")

# Create a global instance
kafka_producer = KafkaProducerService()
