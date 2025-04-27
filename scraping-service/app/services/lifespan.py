import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from database.db import database
from services.producer import sqs_producer
from services.scraping import scrapping_service

scheduler = AsyncIOScheduler(
  timezone="UTC",
  job_defaults={
    "misfire_grace_time": 3600
  },
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown tasks."""
    logging.info("Starting up...")
    
    await database.connect()
    await sqs_producer.initialize()
    
    scheduler.add_job(
        func=scrapping_service.refetch_all,
        trigger="cron",
        hour="0",
        id="daily_refetch"
    )
    scheduler.start()
    
    yield
    
    logging.info("Shutting down...")
    await sqs_producer.stop()
    await database.close()
    await scrapping_service.close()
