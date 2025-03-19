import os
import uvicorn
from fastapi import FastAPI
import asyncio
import logging
from contextlib import asynccontextmanager

from consumer import consume, stop_consumer

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown tasks."""
    consumer_task = asyncio.create_task(consume())  # Start Kafka consumer
    yield
    logging.info("Shutting down Kafka consumer...")
    await stop_consumer()  # Properly stop the consumer
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def read_root():
    return {"status": "Embedding service is running!"}
  
if __name__ == "__main__":
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", 8000))

    print(f"Starting server at {HOST}:{PORT}")
    
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
