import logging
import xxhash
import json
import random
import requests
from datetime import datetime
from bs4 import BeautifulSoup
from langchain_text_splitters import RecursiveCharacterTextSplitter

from models.models import LinkStatusEnum
from database.db import database
from services.producer import sqs_producer
from config.config import BRIGHT_DATA_USERNAME, BRIGHT_DATA_PASSWORD, BRIGHT_DATA_PORT

class ScrappingService:
  def __init__(self):
      pass

  async def scrape(self, link_id_url_maps_str, campaign_id):
    """Background task to scrape URLs and send data to SQS queue"""
    
    # Convert the string to a list of dictionaries
    # Example: '[{"link_id": 1, "url": "http://example.com"}]'
    link_id_url_maps = json.loads(link_id_url_maps_str)

    for link_id_url_maps in link_id_url_maps:
      link_id = link_id_url_maps['link_id']
      url = link_id_url_maps['url']
      url = self.add_protocol_if_missing(url)
      now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
      
      logging.info(f"Processing URL: {url}")
      
      logging.info(f"Successfully saved {url} by the link with id {link_id}")

      try:
        page_html = self.make_request_and_return_page_text(url)

        if not page_html:
          logging.error(f"Failed to request: {url}")
          
          await database.update_link(link_id, None, LinkStatusEnum.Error, now)
          
          continue
      
        preprocessed_text = self.process_page_text_with_bs4_and_regex(page_html)
        
        if not preprocessed_text:
          logging.error(f"Failed to process page text for URL: {url}")
          
          await database.update_link(link_id, None, LinkStatusEnum.Error, now)
          
          continue
        
        # Hash the text
        hashed_text = xxhash.xxh3_64_hexdigest(preprocessed_text)
        
        logging.info(f"Updating link {link_id} with hash {hashed_text}")
        await database.update_link(link_id, hashed_text, LinkStatusEnum.Scrapped, now)

        chunks = self.recursive_text_splitter(preprocessed_text)
        # Remove empty chunks
        chunks = [chunk for chunk in chunks if chunk]

        for chunk in chunks:
          message = {
            "link_id": link_id,
            "chunk": chunk,
            "campaign_id": campaign_id,
          }
          
          await sqs_producer.send_message(message)
      except Exception as e:
        logging.error(f"Error scraping {url}: {str(e)}")
      await database.update_link(link_id, None, LinkStatusEnum.Error, datetime.now())

  def add_protocol_if_missing(self, url):
    """Ensures URL starts with http or https."""
    return url if url.startswith("http") else f"https://{url}"

  def get_random_proxy(self):
    """Returns a random proxy from the list."""

    proxies = [
      f'{BRIGHT_DATA_USERNAME}-ip-178.171.90.55:{BRIGHT_DATA_PASSWORD}@brd.superproxy.io:{BRIGHT_DATA_PORT}',
      f'{BRIGHT_DATA_USERNAME}-ip-78.138.25.40:{BRIGHT_DATA_PASSWORD}@brd.superproxy.io:{BRIGHT_DATA_PORT}',
      f'{BRIGHT_DATA_USERNAME}-ip-178.171.91.184:{BRIGHT_DATA_PASSWORD}@brd.superproxy.io:{BRIGHT_DATA_PORT}',
      f'{BRIGHT_DATA_USERNAME}-ip-103.194.114.224:{BRIGHT_DATA_PASSWORD}@brd.superproxy.io:{BRIGHT_DATA_PORT}',
    ]
    
    return random.choice(proxies)
  
  def get_request_headers(self):
    """Returns the headers for the request"""
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    return headers
  
  def make_request_and_return_page_text(self, url):
    """Makes a request to the given URL using a random proxy. Falls back to default address if the proxy fails."""
    
    proxy = self.get_random_proxy()
    # Get the proxy address for logging. Removes the username and password.
    proxy_address = self.get_proxy_address(proxy)
    headers = self.get_request_headers()
    
    try:
      response = requests.get(url, headers=headers, proxies={"http": proxy, "https": proxy})
      
      if str(response.status_code).startswith('2'):
        logging.info(f"Successfully fetched {url} using proxy {proxy_address}.")
        
        return response.text
      else:
        # If request with proxy fails, try without proxy
        logging.error(f"Failed to fetch {url} using proxy {proxy_address}. Falling back to default address.")
        
        return self.request_without_proxy(url)
    except Exception as e:
      logging.error(f"Error fetching {url} using proxy {proxy_address}. Trying with default address. Error: {str(e)}")
      
      return self.request_without_proxy(url)
  
  def request_without_proxy(self, url):
    '''Request the URL without using a proxy'''
    headers = self.get_request_headers()

    try:
      response = requests.get(url, headers=headers)
      if str(response.status_code).startswith('2'):
        return response.text
      
      else:
        logging.error(f"Failed to fetch {url} using default address.")
        
        return None
    except Exception as e:
      logging.error(f"Error fetching {url} using default address: {str(e)}")
      
      return None
    
  
  def get_proxy_address(self, proxy):
    """Helper function. Strips only the proxy address from the full proxy string. Required for logging."""
    
    if 'ip' in proxy:
      proxy = proxy.split('ip-')[1]
    if ':' in proxy:
      proxy = proxy.split(':')[0]
    return proxy
  
  def process_page_text_with_bs4_and_regex(self, html):
    """Processes the page text using BeautifulSoup and regex."""
    try:
      soup = BeautifulSoup(html, "lxml")
      elements_to_remove = soup(["script", "style", "noscript", 'footer'])
      for tag in elements_to_remove:
          tag.decompose()
      
      return soup.get_text()
    except Exception as e:
      logging.error(f"Error converting HTML to text with BeautifulSoup. Error: {str(e)}")
      
      return None

  def recursive_text_splitter(self, text_to_split):
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

          
scrapping_service = ScrappingService()