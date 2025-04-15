import pydantic
import os
import uvicorn
from fastapi import FastAPI, BackgroundTasks
import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from redis import Redis

from producer import sqs_producer
from utils import scrape_url_and_get_text, add_protocol_if_missing, get_preprocessed_text, generate_text_hash, chunk_text
from db import database, LinkStatusEnum

logging.basicConfig(level=logging.INFO)

redis = Redis(host="localhost", port=6379, decode_responses=True)

class ScrapingRequest(pydantic.BaseModel):
    urls: list[str]
    campaign_id: int

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

app = FastAPI(lifespan=lifespan)

# TODO: Testing endpoint. Remove
@app.get('/redis/set')
async def set_key(key: str, value: str):
    try:
        redis.set(key, value)
        return {"message": "Key set"}
    except Exception as e:
        return {"message": str(e)}

@app.get("/")
async def read_root():
    """Health check endpoint."""
    return {"status": "ok"}

async def process_scraping(urls: list[str], campaign_id: int):
    """Background task to scrape URLs and send data to SQS queue"""

    for url in urls:
        url = add_protocol_if_missing(url)
        
        logging.info(f"Processing URL: {url}")
        
        link_id = await database.save_link(url, campaign_id)
        
        logging.info(f"Successfully saved {url} by the link with id {link_id}")

        try:
            page_text = scrape_url_and_get_text(url)
            preprocessed_text = get_preprocessed_text(page_text)
            scrapped_url_hash = generate_text_hash(preprocessed_text)
            now = datetime.now()

            logging.info(f"Updating link {link_id} with hash {scrapped_url_hash}")
            await database.update_link(link_id, scrapped_url_hash, LinkStatusEnum.Scrapped, now)

            chunks = chunk_text(preprocessed_text)
            # Remove empty chunks
            chunks = [chunk for chunk in chunks if chunk]
            
            # TODO: Add Redis call here if needed
            redis_campaign_chunks_key = f"campaign:{campaign_id}:chunks"
            
            current_amount_of_chunks = redis.get(redis_campaign_chunks_key)
            if current_amount_of_chunks:
                current_amount_of_chunks = int(current_amount_of_chunks)
                redis.setex(redis_campaign_chunks_key, 3600, current_amount_of_chunks + len(chunks))
            else:
                redis.setex(redis_campaign_chunks_key, 3600, len(chunks))
                        
            for chunk in chunks:
                message = {
                    "link_id": link_id,
                    "chunk": chunk,
                    "campaign_id": campaign_id,
                }

                await sqs_producer.send_message(message)
        except Exception as e:
            logging.error(f"Error scraping {url}: {str(e)}")
            await database.update_link(link_id, None, LinkStatusEnum.Error, datetime.now())

@app.post("/scrape")
async def scrape_urls(scraping_request: ScrapingRequest, background_tasks: BackgroundTasks):
    """Initiates background scraping process and returns immediately."""
    
    background_tasks.add_task(process_scraping, scraping_request.urls, scraping_request.campaign_id)

    return {"message": "Scraping started", "urls": scraping_request.urls, "campaign_id": scraping_request.campaign_id}

if __name__ == "__main__":
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", 8000))

    print(f"Starting server at {HOST}:{PORT}")
    
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
