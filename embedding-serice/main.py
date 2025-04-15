import os
import uvicorn
from fastapi import FastAPI
import asyncio
import logging
from contextlib import asynccontextmanager
from redis import Redis

from consumer import chunks_consumer
from db import database

logging.basicConfig(level=logging.INFO)

redis = Redis(host="localhost", port=6379, decode_responses=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown tasks."""
    consumer_task = asyncio.create_task(chunks_consumer.consume())
    yield
    
    logging.info("Shutting down the service...")

    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass
    await database.close()

app = FastAPI(lifespan=lifespan)

# TODO: Testing endpoint. Remove
@app.get('/redis/get')
async def redis_get(key: str):
    return redis.get(key)

@app.get("/")
async def read_root():
    return {"status": "Embedding service is running!"}
  
if __name__ == "__main__":
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", 8000))

    print(f"Starting server at {HOST}:{PORT}")
    
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
