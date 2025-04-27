from sentence_transformers import SentenceTransformer

from config.config import EMBEDDING_MODEL_NAME

class Embedding:
  def __init__(self):
    self.sentenceTransformer = SentenceTransformer(EMBEDDING_MODEL_NAME)

  def get_embedded_text(self, text: str):
    embedding = self.sentenceTransformer.encode(text)
    
    return embedding

embedding_class = Embedding()