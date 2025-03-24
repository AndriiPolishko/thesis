
import os
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8000))

KAFKA_BROKER = os.getenv("KAFKA_BROKER")
EMAIL_GENERATION_TOPIC = os.getenv("EMAIL_GENERATION_TOPIC")
KAFKA_GROUP_ID = os.getenv("KAFKA_GROUP_ID")

SEND_EMAIL_TOPIC = os.getenv("SEND_EMAIL_TOPIC")
