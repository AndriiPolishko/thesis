from fastapi import APIRouter, FastAPI
import uvicorn
from contextlib import asynccontextmanager
import asyncio

from config import HOST, PORT
from consumer import email_creation_consumer
from producer import email_producer
from db import database

# TODO: remove
from vector_db_retriever import fetch_related_info_from_vector_db_based_on_last_message

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

# @router.get('/test_retrieve')
# async def test_retrieve():
#   test_text = "what is the price"
#   fetched_data = await fetch_related_info_from_vector_db_based_on_last_message(test_text)
  
#   # Get only first elements from fetched data. It has a text chunks
#   text_chunks = [item[0] for item in fetched_data]
  
#   return text_chunks

app = FastAPI(lifespan=lifespan)

app.include_router(router)
  
if __name__ == '__main__':
  print(f"Starting server at {HOST}:{PORT}")
  
  uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
