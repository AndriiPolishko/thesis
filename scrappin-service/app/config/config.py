import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5434")
DB_NAME = os.getenv("DB_NAME", "db")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASSWORD", "root")
# Embedding Model
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME")
# AWS
AWS_REGION = os.getenv("AWS_REGION", "us-north-1")
SQS_EMBEDDING_QUEUE_URL=os.getenv("SQS_EMBEDDING_QUEUE_URL")
# Bright Data
BRIGHT_DATA_USERNAME = os.getenv("BRIGHT_DATA_USERNAME")
BRIGHT_DATA_PASSWORD = os.getenv("BRIGHT_DATA_PASSWORD")
BRIGHT_DATA_PORT = os.getenv("BRIGHT_DATA_PORT")