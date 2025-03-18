from sentence_transformers import SentenceTransformer
from langchain.text_splitter import CharacterTextSplitter
import uuid

from embeddingService.ragService.src.controller import CreateCampaignDto


class EmbeddingService:  
  def __init__(self):
    ...
  
  def return_ok(self):
    return "OK"

  # TODO: add better return type
  '''
  Embed the text and save it to the database
  @public
  '''
  def embed_and_save(self, text: str):
    chunks = self.get_text_chunks(text)
    # generate random id
    text_id = str(uuid.uuid4())
    
    # TODO: 

  '''
  Split the text into chunks of 1024 characters
  @private
  '''
  def get_text_chunks(self, text: str):
    text_splitter = CharacterTextSplitter(
    chunk_size = 1024,
    chunk_overlap  = 128
    )
    docs = text_splitter.create_documents([text])
    chunks = []
    
    for doc in docs:
      chunks.append(doc.page_content)
    
    return chunks

  '''
  Check if the chroma-db service is up and running
  @public
  '''
  def check_chroma_hearbeat(self):
    return self.chroma_client.heartbeat()
  
  def query_db_by_text(self, text: str):
    # FIXME: this works verrrrry slow
    results = self.collection.query(
      query_texts=[text],
      n_results=1
    )
    
    print(results)
    
    distances = results['distances']
    documents = results['documents']
    
    # Get the id of the shortest distance
    shortest_distance_index = distances.index(min(distances))
    corresponding_document = documents[shortest_distance_index]
    
    return corresponding_document

  '''
  for now this function not creates a campaign, but generates embeddings
  '''
  def create_campaign(self, createCampaignDto: CreateCampaignDto):
    content = createCampaignDto.textContent
    emails = createCampaignDto.emails
    
    first_email = emails[0]
    
    
    