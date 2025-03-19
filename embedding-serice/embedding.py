from sentence_transformers import SentenceTransformer

from config import EMBEDDING_MODEL_NAME

class Embedding:
  def __init__(self):
    self.sentenceTransformer = SentenceTransformer(EMBEDDING_MODEL_NAME)

  def get_embedded_text(self, splitted_text: list):
    embeddings = self.sentenceTransformer.encode(splitted_text)
    
    return embeddings

  def get_embedded_text(self, text: str):
    sentenceTransformer = SentenceTransformer(EMBEDDING_MODEL_NAME)
    embedding = self.sentenceTransformer.encode(text)
    
    return embedding

embedding_class = Embedding()