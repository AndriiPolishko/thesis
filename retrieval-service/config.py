
import os
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8000))

KAFKA_BROKER = os.getenv("KAFKA_BROKER")
EMAIL_GENERATION_TOPIC = os.getenv("EMAIL_GENERATION_TOPIC")
KAFKA_GROUP_ID = os.getenv("KAFKA_GROUP_ID")

SEND_EMAIL_TOPIC = os.getenv("SEND_EMAIL_TOPIC")

# Database Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5434")
DB_NAME = os.getenv("DB_NAME", "db")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "root")

# Embedding Model
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME")