import psycopg as pg
import logging

from config.config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS

class Database:
    def __init__(self):
      """Initialize without a connection."""
      self.conn = None

    async def connect(self):
        """Creates the database connection."""
        if self.conn is None:
            connection_string = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
            self.conn = await pg.AsyncConnection.connect(conninfo=connection_string)
    
    async def close(self):
      """Closes the database connection."""
      if self.conn:
          await self.conn.close()
          self.conn = None
          
    async def insert_embedding(self, link_id: str, chunk: str, embedding: list):
      """Inserts the embedding into the database."""

      try:
        if self.conn is None:
          await self.connect()
            
        query = '''INSERT INTO chunk (link_id, chunk, embedding, text_search_vector) 
        VALUES (%(link_id)s, 
        %(chunk)s, 
        %(embedding)s, 
        to_tsvector('english', %(chunk)s)
        );'''
        params = {
          "chunk": chunk,
          "embedding": embedding.tolist(),
          "link_id": link_id
        }
        
        await self.conn.execute(query, params)
        
        await self.conn.commit()
        
        return True
      except Exception as e:
        await self.conn.rollback()
        
        return False

    async def find_chunk_by_hash(self, chunk_hash):
      """Finds a chunk by its hash."""

      query = "SELECT * FROM embedding WHERE chunk_hash = %s;"

      try:
        await self.connect()  # Ensure connection is available

        async with self.conn.cursor() as cur:
          await cur.execute(query, (chunk_hash))
          result = await cur.fetchone()
          
          return result
      except Exception as e:
          logging.error(f"Error finding chunk by hash: {e}")
      finally:
          await self.close()
      
database = Database()