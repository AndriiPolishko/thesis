import psycopg as pg
from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS

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
            
        query = "INSERT INTO embedding (link_id, chunk, embedding) VALUES (%s, %s, %s)"
        
        embedding_list = embedding.tolist()
        
        await self.conn.execute(query, (link_id, chunk, embedding_list))
        
        await self.conn.commit()
        
        return True
      except Exception as e:
        return False
      
database = Database()