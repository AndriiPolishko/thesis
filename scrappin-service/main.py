from fastapi import FastAPI
import uvicorn
import asyncio
from aiokafka import AIOKafkaConsumer
import json
import re
import requests
from bs4 import BeautifulSoup
import copy
import nltk
import xxhash
from sentence_transformers import SentenceTransformer
import psycopg as pg
from datetime import datetime


# nltk.download("punkt")

app = FastAPI()

# TODO: move model name to env
embedding_model = SentenceTransformer("paraphrase-MiniLM-L6-v2")

# TODO: separate into a different files

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
  text = re.sub(r'\n', ' ', text)
  # Remove repetitive spaces
  text = re.sub(r' +', ' ', text)
  text = text.strip()
  
  return text

def split_text(text, max_tokens=128):
    """Splits text into semantically meaningful chunks with SentenceTransformers."""
    sentences = nltk.sent_tokenize(text)  # Split into sentences
    chunks = []
    current_chunk = []
    current_length = 0

    for sentence in sentences:
        tokens = embedding_model.tokenizer(sentence)["input_ids"]  # Count tokens
        num_tokens = len(tokens)

        if current_length + num_tokens <= max_tokens:
            current_chunk.append(sentence)
            current_length += num_tokens
        else:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentence]
            current_length = num_tokens

    if current_chunk:
        chunks.append(" ".join(current_chunk))  # Add last chunk

    return chunks
  
def add_protocol_if_missing(url):
    if not url.startswith("http"):
        url = f"https://{url}"
    
    return url
  
async def connect_to_db():
  # TODO: move to env
  pg_port = 5434
  db_name = "db"
  connection = f"postgresql://root:root@localhost:{pg_port}/{db_name}"
  aconn = await pg.AsyncConnection.connect(conninfo=connection)
  
  return aconn

async def consume():
  consumer = AIOKafkaConsumer(
      "urls", # Topic name
      bootstrap_servers="localhost:9092", # Kafka server
      group_id="urls-consumer-group", # Consumer
      auto_offset_reset="earliest" # Start from the beginning
  )
  await consumer.start()
  
  print('Consumer started')
  
  try:
      async for msg in consumer:
        message_str = msg.value.decode()  # Convert bytes to string
        
        try:
            message_obj = json.loads(message_str)  # Convert JSON string to Python dict
            link_id = message_obj.get("id")  # Extract link ID
            campaign_id = message_obj.get("campaignId")  # Extract campaign ID
            url = message_obj.get("url")  # Extract URL
            url = add_protocol_if_missing(url)
            
            page_text = 'mock' # scrape_url_and_get_text(url)
            preprocessed_text = get_preprocessed_text(page_text)
            scrapped_url_hash = xxhash.xxh64(preprocessed_text).hexdigest()
            
            aconn = await connect_to_db()
            
            update_link_query = "UPDATE link SET last_scrapped = (%s), scrapped_url_hash = (%s), status = (%s) WHERE id = (%s);"
            now = datetime.now()

            print(f"Updating link {link_id} with scrapped_url_hash {scrapped_url_hash} and status Scrapped and last_scrapped {now}")
            
            await aconn.execute(update_link_query, (now, scrapped_url_hash, "Scrapped", link_id))
            
            await aconn.commit()
            
            # chunks = split_text(preprocessed_text)
            
            # for chunk in chunks:
            
            
        except json.JSONDecodeError:
            print(f"Error decoding message: {message_str}")
  finally:
      await consumer.stop()
      
      print('Consumer stopped')
  
@app.on_event("startup")
async def start_consumer():
    asyncio.create_task(consume())


@app.get("/")
async def read_root():
    return {"status": "Kafka Consumer Running"}