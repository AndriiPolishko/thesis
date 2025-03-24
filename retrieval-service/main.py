from fastapi import APIRouter, FastAPI
import uvicorn
from contextlib import asynccontextmanager
from aiokafka import AIOKafkaConsumer
import asyncio

from config import HOST, PORT
from consumer import email_creation_consumer
from producer import email_producer

router = APIRouter()

@asynccontextmanager
async def lifespan(app: FastAPI):
  # initialize email generation consumer
  await email_creation_consumer.initialize()
  await email_producer.initialize()
  
  consumer_task = asyncio.create_task(email_creation_consumer.consume())
  
  
  yield
  
  await email_creation_consumer.stop()
  consumer_task.cancel()
  await email_producer.stop()


@router.get("/")
async def root():
  return 'OK'

app = FastAPI(lifespan=lifespan)

app.include_router(router)
  
if __name__ == '__main__':
  print(f"Starting server at {HOST}:{PORT}")
  
  uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
