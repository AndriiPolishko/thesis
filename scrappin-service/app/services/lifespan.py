import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager

from database.db import database
from services.producer import sqs_producer

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown tasks."""
    logging.info("Starting up...")
    
    await database.connect()
    await sqs_producer.initialize()
    
    yield
    
    logging.info("Shutting down...")
    await sqs_producer.stop()
    await database.close()
