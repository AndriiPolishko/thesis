import logging
import xxhash
import json
import random
import httpx
import asyncio
import re
from httpx import AsyncHTTPTransport
from bs4 import BeautifulSoup
from langchain_text_splitters import RecursiveCharacterTextSplitter

from models.models import LinkStatusEnum
from database.db import database
from services.producer import sqs_producer
from config.config import BRIGHT_DATA_USERNAME, BRIGHT_DATA_PASSWORD, BRIGHT_DATA_PORT
from services.utils import now

max_concurrency = 20

proxies = [
  f'{BRIGHT_DATA_USERNAME}-ip-178.171.90.55:{BRIGHT_DATA_PASSWORD}@brd.superproxy.io:{BRIGHT_DATA_PORT}',
  f'{BRIGHT_DATA_USERNAME}-ip-78.138.25.40:{BRIGHT_DATA_PASSWORD}@brd.superproxy.io:{BRIGHT_DATA_PORT}',
  f'{BRIGHT_DATA_USERNAME}-ip-178.171.91.184:{BRIGHT_DATA_PASSWORD}@brd.superproxy.io:{BRIGHT_DATA_PORT}',
  f'{BRIGHT_DATA_USERNAME}-ip-103.194.114.224:{BRIGHT_DATA_PASSWORD}@brd.superproxy.io:{BRIGHT_DATA_PORT}',
]

class ScrapingService:
  def __init__(self):
    self.default_client = httpx.AsyncClient(timeout=30.0)
    
    self.semaphore = asyncio.Semaphore(max_concurrency)
    
    self._clients = []
    
    for raw in proxies:
      proxy_url = raw if raw.startswith("http") else f"http://{raw}"
      transport = AsyncHTTPTransport(proxy=proxy_url)
      client = httpx.AsyncClient(transport=transport, timeout=30.0)

      self._clients.append(client)
    
  async def scrape(self, link_id_url_maps_str, campaign_id):
    """Background task to scrape URLs and send data to SQS queue"""
    
    # Convert the string to a list of dictionaries
    # Example: '[{"link_id": 1, "url": "http://example.com"}]'
    mappings = json.loads(link_id_url_maps_str)
    tasks = []
    
    for mapping in mappings:
        link_id = mapping["linkId"]
        urls = mapping['linkUrl']
        urls = urls.split(', ')
        
        for url in urls:
          tasks.append(
              self._bounded_process(link_id, url, campaign_id, existing_hash=None)
          )
      
    await asyncio.gather(*tasks)

  async def refetch_all(self) -> None:
    '''Refetch all links from the database and process them'''
    all_links = await database.get_all_links_for_campaign()
    tasks = []
    for link in all_links:
        url = link["url"]
        
        tasks.append(
            self._bounded_process(
                link["id"], url, link["campaign_id"], link.get("scrapped_url_hash"),
            )
        )
        
    await asyncio.gather(*tasks)
    
  async def _process_link(self, link_id, url, campaign_id, existing_hash=None) -> None:
    """Processes a single link, fetches the page, and checks if page was updated.
    If the page was updated or it is new, it sends the chunks to SQS.
    """
    
    url = self._add_protocol_if_missing(url)
    html = await self._fetch_page(url)

    if not html:
      await database.update_link(link_id, None, LinkStatusEnum.Error, now())
      
      return

    text = self._process_page_text_with_bs4_and_regex(html)
    
    if not text:
      await database.update_link(link_id, None, LinkStatusEnum.Error, now())
      
      return

    new_hash = xxhash.xxh3_64_hexdigest(text)
    
    if existing_hash and new_hash == existing_hash:
      logging.info("No change for %s", url)
      
      return

    await database.update_link(link_id, new_hash, LinkStatusEnum.Scrapped, now())

    chunks = [c for c in self._recursive_text_splitter(text) if c]

    await self._send_chunks(link_id, campaign_id, chunks)
  
  async def _bounded_process(
    self,
    link_id: int,
    url: str,
    campaign_id: int,
    existing_hash: str | None,
    ) -> None:
      """Bounded process to limit concurrency"""

      async with self.semaphore:
        await self._process_link(link_id, url, campaign_id, existing_hash)
    
  async def _send_chunks(self, link_id, campaign_id, chunks):
    '''Sends the chunks to SQS queue'''

    for chunk in chunks:
      message = {
        "link_id": link_id,
        "chunk": chunk,
        "campaign_id": campaign_id,
      }
        
      await sqs_producer.send_message(message)
      
  def _choose_client(self):
    """Returns a random client from the list of clients."""

    return random.choice(self._clients)

  def _add_protocol_if_missing(self, url):
    """Ensures URL starts with http or https."""
    
    return url if url.startswith("http") else f"https://{url}"

  def _get_request_headers(self):
    """Returns the headers for the request"""
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.107 Safari/537.36'}
    
    return headers
  
  async def _fetch_page(self, url):
    """Makes a request to the given URL using a random proxy. Falls back to default address if the proxy fails."""
    
    random_client = self._choose_client()
    headers = self._get_request_headers()
    
    try:
      response = await random_client.get(url, headers=headers)
      
      response.raise_for_status()
      
      logging.info(f"Successfully fetched {url} using proxy.")
        
      return response.text
    except Exception as e:
      logging.error(f"Error fetching {url} using proxy. Trying with default address. Error: {str(e)}")
      
      return await self._request_without_proxy(url)
  
  async def _request_without_proxy(self, url):
    '''Request the URL without using a proxy'''
    headers = self._get_request_headers()

    try:
      response = await self.default_client.get(url, headers=headers)
      
      response.raise_for_status()
      
      logging.info(f"Successfully fetched {url} using default address.")
      
      return response.text
    except Exception as e:
      logging.error(f"Error fetching {url} using default address: {str(e)}")
      
      return None
    
  def _process_page_text_with_bs4_and_regex(self, html):
    """Processes the page text using BeautifulSoup and regex."""
    try:
      soup = BeautifulSoup(html, "lxml")
      elements_to_remove = soup(["script", "style", "noscript", 'footer'])
      for tag in elements_to_remove:
          tag.decompose()
      
      text = soup.get_text(separator="\n", strip=True)
      text = re.sub(r'\s+', ' ', text)
    
      return text
    except Exception as e:
      logging.error(f"Error converting HTML to text with BeautifulSoup. Error: {str(e)}")
      
      return None

  def _recursive_text_splitter(self, text_to_split):
    """Splits the text into smaller chunks using RecursiveCharacterTextSplitter."""

    text_splitter = RecursiveCharacterTextSplitter(
      # Set a really small chunk size, just to show.
      chunk_size=256,
      chunk_overlap=25,
      length_function=len,
      is_separator_regex=False,
    )
    
    splitted_text = text_splitter.split_text(text_to_split)
    
    return splitted_text
  
  async def close(self):
    """Closes all clients."""
    for client in self._clients:
      await client.aclose()

    await self.default_client.aclose()
    
    

scrapping_service = ScrapingService()