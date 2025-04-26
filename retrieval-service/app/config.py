
import os
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8002))

# Database Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5434")
DB_NAME = os.getenv("DB_NAME", "db")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "root")

# Embedding Model
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME")

# AWS
AWS_REGION = os.getenv("AWS_REGION", "us-north-1")
SQS_MESSAGE_GENERATION_QUEUE_URL=os.getenv("SQS_MESSAGE_GENERATION_QUEUE_URL")
SQS_GENERATED_MESSAGE_QUEUE_URL=os.getenv("SQS_GENERATED_MESSAGE_QUEUE_URL")

# Cohere
COHERE_API_KEY = os.getenv("COHERE_API_KEY")