import os
import uvicorn
from fastapi import FastAPI
import logging
from redis import Redis

from api.scraping import router as scraping_router
from services.lifespan import lifespan

redis = Redis(host="localhost", port=6379, decode_responses=True)

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
    """Health check endpoint"""
    return {"status": "ok"}

app.include_router(scraping_router)

if __name__ == "__main__":
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", 8000))

    logging.info(f"Starting server at {HOST}:{PORT}")
    
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
