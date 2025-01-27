from fastapi import APIRouter
from pydantic import BaseModel
from enum import Enum

from .service import return_ok, embed_and_save

class ItemType(Enum):
  Text = "text"
  File = "file"
  Link = "link"

class Item(BaseModel):
  value: str
  type: ItemType

router = APIRouter()

@router.get("/")
async def hello_world():
  return return_ok()

@router.post('/embed-and-save')
async def embed_and_save(item: Item):
  value = item.value
  type = item.type
  
  embed_and_save(value)
  
  return 'tmp'
  