import re
import requests
import copy
import nltk
import xxhash
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel

from config import EMBEDDING_MODEL_NAME

# nltk.download("punkt")  # Uncomment if needed

embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)

class ScrappingResponse(BaseModel):
  error: str = None
  scrapped_text: str = None

def scrape_url_and_get_text(url) -> ScrappingResponse:
    """Scrapes a webpage and returns cleaned text."""
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
      return ScrappingResponse(error=f"Failed to fetch URL: {url}")

    soup = BeautifulSoup(response.text, 'html.parser')
    footer = soup.find("footer")
    if footer:
        footer.decompose()

    return soup.get_text()

def get_preprocessed_text(text):
    """Cleans and normalizes text."""
    return re.sub(r'\s+', ' ', text.strip())

def chunk_text(text, max_tokens=128):
    """Splits text into chunks based on token limits."""
    sentences = nltk.sent_tokenize(text)
    chunks, current_chunk = [], []
    current_length = 0

    for sentence in sentences:
        tokens = embedding_model.tokenizer(sentence)["input_ids"]
        num_tokens = len(tokens)

        if current_length + num_tokens <= max_tokens:
            current_chunk.append(sentence)
            current_length += num_tokens
        else:
            chunks.append(" ".join(current_chunk))
            current_chunk, current_length = [sentence], num_tokens

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks

def add_protocol_if_missing(url):
    """Ensures URL starts with http or https."""
    return url if url.startswith("http") else f"https://{url}"

def generate_text_hash(text):
    """Generates a hash of text content."""
    return xxhash.xxh64(text).hexdigest()
