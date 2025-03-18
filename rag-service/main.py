from pydantic import BaseModel
from fastapi import APIRouter, FastAPI
import uvicorn
import os
import requests
from bs4 import BeautifulSoup
import copy
import re
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import SentenceTransformersTokenTextSplitter
import psycopg as pg
import uuid

class Links(BaseModel):
  campaign_id: int
  links: list

# from src.rag.controller import router as rag_router

app = FastAPI()

router = APIRouter()

@router.get("/")
async def root():
  return 'ok'

@router.post('/main')
async def main(links: list[Links]):
  acon = await connect_to_db()
  # FIXME: get all urls
  urls = links[0].links
  campaign_id = links[0].campaign_id
  sentence_transformer = SentenceTransformer("all-MiniLM-L6-v2")
  
  for url in urls:
    scrapped_text = scrape_url_and_get_text(url)
    preprocessed_text = get_preprocessed_text(scrapped_text)
    docs = get_docs_from_text(preprocessed_text)
    
    await insert_embeddings_into_table(docs, acon, campaign_id, sentence_transformer)
  
def scrape_url_and_get_text(url):
  # Define headers with a common browser User-Agent
  headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'}
  response = requests.get(url, headers=headers)

  if response.status_code == 200:
      html = response.text
      soup = BeautifulSoup(html, 'html.parser')
  else:
      print('Error:', response.status_code)
  
  soup_without_footer = copy.deepcopy(soup)

  # Remove the footer tag
  footer = soup_without_footer.find("footer")
  if footer:
      footer.decompose()

  text = soup_without_footer.get_text()
  
  return text

def get_preprocessed_text(text):
  # Remove new lines
  text = re.sub(r'\n', ' ', text)
  # Remove repetitive spaces
  text = re.sub(r' +', ' ', text)
  # Turn to lowercase
  text = text.lower()
  
  return text

def get_spitted_text(text):
  sentence_transformers_token_text_splitter = SentenceTransformersTokenTextSplitter(
    model_name = "all-MiniLM-L6-v2",
    tokens_per_chunk = 100, #1024,
    chunk_overlap = 10 #128    
  )

  splitted_text = sentence_transformers_token_text_splitter.split_text(text)

  return splitted_text

def get_docs_from_text(text):
  sentence_transformers_token_text_splitter = SentenceTransformersTokenTextSplitter(
    model_name = "all-MiniLM-L6-v2",
    tokens_per_chunk = 100, #1024,
    chunk_overlap = 10 #128    
  )
  docs = sentence_transformers_token_text_splitter.create_documents([text])
  
  return docs

def get_embedded_text(splitted_text):
  sentenceTransformer = SentenceTransformer("all-MiniLM-L6-v2")
  texts_embeddings = sentenceTransformer.encode(splitted_text)
  
  return texts_embeddings

async def connect_to_db():
  pg_port = 5434
  db_name = "db"
  connection = f"postgresql://root:root@localhost:{pg_port}/{db_name}"
  aconn = await pg.AsyncConnection.connect(conninfo=connection)
  
  return aconn

async def insert_embeddings_into_table(docs, aconn, campaign_id, embedding_model):
  collection_uuid = uuid.uuid4()

  # Insert into embedding_collection
  embedding_collection_insert_query = "INSERT INTO embedding_collection (uuid, campaign_id) VALUES (%s, %s);"
  await aconn.execute(embedding_collection_insert_query, (collection_uuid, campaign_id))

  # Insert embeddings
  for doc in docs:
      page_content = doc.page_content  # No need for manual escaping
      embedding = embedding_model.encode(page_content).tolist()  # Convert to list
      embedding_uuid = uuid.uuid4()

      embedding_insert_query = """
          INSERT INTO embedding (uuid, collection_uuid, embedding, document) 
          VALUES (%s, %s, %s, %s);
      """
      
      await aconn.execute(embedding_insert_query, (embedding_uuid, collection_uuid, embedding, page_content))
    

  await aconn.commit()
  
app.include_router(router)

if __name__ == '__main__':
  # TODO: check why getting from env file is not working
  port = int(os.environ.get('PORT', 8080))
  host = os.environ.get('HOST', 'localhost')
  
  uvicorn.run('main:app', port=port, host=host, reload=True)