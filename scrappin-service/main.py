from fastapi import FastAPI
import asyncio
import logging
from contextlib import asynccontextmanager
from consumer import consume

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown tasks."""
    consumer_task = asyncio.create_task(consume())
    yield
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def read_root():
    return {"status": "Kafka Consumer Running"}
