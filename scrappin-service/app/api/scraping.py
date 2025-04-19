from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

from services.scraping import scrapping_service

router = APIRouter(
    prefix="/scrape",
    tags=["scraping"],
)

class ScrapingRequest(BaseModel):
    link_id_url_maps_str: str
    campaign_id: int
    
@router.post("/", status_code=202)
async def scrape_urls(
    request: ScrapingRequest,
    background: BackgroundTasks
):
    """
    Kick off background scraping and return immediately.
    """
    background.add_task(scrapping_service.scrape, request.link_id_url_maps_str, request.campaign_id)

    return {
        "message": "Scraping started",
        "campaign_id": request.campaign_id,
    }