from fastapi import APIRouter
from pydantic import BaseModel
from enum import Enum

from .service import EmbeddingService

class ItemType(Enum):
  Text = "text"
  File = "file"
  Link = "link"

class Item(BaseModel):
  value: str
  type: ItemType
  
class CreateCampaignDto(BaseModel):
  emails: list
  textContent: str
  documentContent: str
  links: list

router = APIRouter()

embedding_service = EmbeddingService()

@router.get("/")
async def hello_world():
  return embedding_service.return_ok()

@router.post('/embed-and-save')
async def embed_and_save(item: Item):
  value = item.value
  type = item.type
  
  result = embedding_service.embed_and_save(value)
    
  return embedding_service.return_ok()

@router.get('/check-chroma-heartbeat')
async def check_chroma_heartbeat():
  return embedding_service.check_chroma_hearbeat()

@router.get('/query-db-by-text')
async def query_db_by_text(text: str):
  return embedding_service.query_db_by_text(text)

@router.post('/campaign/create')
async def create_campaign(createCampaignDto: CreateCampaignDto):
  return embedding_service.create_campaign()
  