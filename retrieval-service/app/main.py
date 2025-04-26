import uvicorn
import asyncio
from fastapi import APIRouter, FastAPI
from contextlib import asynccontextmanager

from config import HOST, PORT
from sqs_queue.consumer import email_creation_consumer
from sqs_queue.producer import email_producer
from database.db import database

router = APIRouter()

@asynccontextmanager
async def lifespan(app: FastAPI):
  # initialize email generation consumer
  await email_producer.initialize()
  
  consumer_task = asyncio.create_task(email_creation_consumer.consume())
  
  yield
  
  # Stop the consumer and producer
  consumer_task.cancel()
  await email_producer.stop()
  # Stop the database connection
  await database.close()


@router.get("/")
async def root():
  return 'OK'

app = FastAPI(lifespan=lifespan)

app.include_router(router)
  
if __name__ == '__main__':
  print(f"Starting server at {HOST}:{PORT}")
  
  uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
