import os
import uvicorn
from fastapi import FastAPI
import logging

from api.scraping import router as scraping_router
from services.lifespan import lifespan


app = FastAPI(lifespan=lifespan)

@app.get("/")
async def read_root():
    """Health check endpoint"""
    return {"status": "ok"}

app.include_router(scraping_router)

if __name__ == "__main__":
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 5003))

    logging.info(f"Starting server at {HOST}:{PORT}")
    
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
