import psycopg as pg

from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

class Database:
    def __init__(self):
      """Initialize without a connection."""
      self.conn = None

    async def connect(self):
        """Creates the database connection."""
        if self.conn is None:
            connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
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
    
    async def semantic_retrieval(self, query_embedding: list, top_k: int = 25):
        '''
        Retrieve chunks with the highest cosine similarity to the query_embedding.
        '''
        if self.conn is None:
            await self.connect()
        
        # Ensure the embedding is a list of floats
        query_embedding = list(query_embedding)
        
        query = """
        SELECT chunk
        FROM chunk
        ORDER BY embedding <#> %s::vector
        LIMIT %s;
        """
        
        try:
            async with self.conn.cursor() as cursor:
                await cursor.execute(query, (query_embedding, top_k))
                rows = await cursor.fetchall()
                chunks = []
                
                for row in rows:
                  chunks.append(row[0])
              
                return chunks
        except Exception as e:
            print(f"Error retrieving related chunks: {e}")
            
            self.conn.rollback()
            
            return []
    
    async def key_word_retrieval(self, query: str, top_k: int = 25):
      """Performs a keyword search using the query and returns the top_k results."""
  
      sql = """
      SELECT chunk
      FROM chunk
      WHERE text_search_vector @@ plainto_tsquery('english', %s)
      LIMIT %s;
      """
      
      params = (query, top_k)
      
      try:
        async with self.conn.cursor() as cursor:
          await cursor.execute(sql, params)
          rows = await cursor.fetchall()
          
          chunks = []
              
          for row in rows:
            chunks.append(row[0])
        
          return chunks
      except Exception as e:
        print(f"Error performing keyword search: {e}")
        
        self.conn.rollback()
        
        return None
      
database = Database()