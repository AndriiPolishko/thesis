from sentence_transformers import SentenceTransformer
from langchain.text_splitter import CharacterTextSplitter

class EmbeddingService:
  def return_ok(self):
    return "OK"

  def embed_and_save(self, text: str):
    chunks = self.get_text_chunks(text)
    sentence_transformer = SentenceTransformer("all-MiniLM-L6-v2")
    embedded_chunks = sentence_transformer.encode(chunks)
    
    print(embedded_chunks)
    
    
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
  