import pydantic
import os
import uvicorn
from fastapi import FastAPI, BackgroundTasks
import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from producer import kafka_producer
from utils import scrape_url_and_get_text, add_protocol_if_missing, get_preprocessed_text, generate_text_hash, chunk_text
from db import database, LinkStatusEnum

logging.basicConfig(level=logging.INFO)

class ScrapingRequest(pydantic.BaseModel):
    urls: list[str]
    campaign_id: int

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown tasks."""
    await database.connect()
    await kafka_producer.start()
    
    yield
    
    logging.info("Shutting down Kafka producer...")
    await kafka_producer.stop()
    await database.close()

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def read_root():
    """Health check endpoint."""
    return {"status": "ok"}

async def process_scraping(urls: list[str], campaign_id: int):
    """Background task to scrape URLs and send data to Kafka."""
    for url in urls:
        url = add_protocol_if_missing(url)
        link_id = await database.save_link(url, campaign_id)

        try:
            page_text = scrape_url_and_get_text(url)
            preprocessed_text = get_preprocessed_text(page_text)
            scrapped_url_hash = generate_text_hash(preprocessed_text)
            now = datetime.now()

            logging.info(f"Updating link {link_id} with hash {scrapped_url_hash}")
            await database.update_link(link_id, scrapped_url_hash, LinkStatusEnum.Scrapped, now)

            chunks = chunk_text(preprocessed_text)
            for chunk in chunks:
                message = {
                    "link_id": link_id,
                    "campaign_id": campaign_id,
                    "chunk": chunk
                }
                
                # TODO: Add Redis call here if needed
                
                await kafka_producer.send_message(message)
        except Exception as e:
            logging.error(f"Error scraping {url}: {str(e)}")
            await database.update_link(link_id, None, LinkStatusEnum.Failed, datetime.now())

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
