# producer.py
import json
from aiokafka import AIOKafkaProducer
from config import KAFKA_BROKER, SEND_EMAIL_TOPIC


class EmailProducer:
    def __init__(self):
        self.producer = None

    async def initialize(self):
        self.producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BROKER)
        await self.producer.start()

    async def stop(self):
        if self.producer:
            await self.producer.stop()

    async def send_email_payload(self, payload: dict):
        if not self.producer:
            raise RuntimeError("Producer not started. Call `start()` first.")
        
        message = json.dumps(payload).encode("utf-8")
        await self.producer.send_and_wait(SEND_EMAIL_TOPIC, message)

email_producer = EmailProducer()