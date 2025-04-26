import psycopg as pg
import logging
from psycopg.rows import dict_row

from config.config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS

class Database:
    def __init__(self):
      """Initialize without a connection."""
      self._conn = None

    async def connect(self):
        """Creates the database connection."""
        if self._conn is None:
          connection_string = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
          self._conn = await pg.AsyncConnection.connect(conninfo=connection_string)

    async def close(self):
        """Closes the database connection."""
        if self._conn:
          await self._conn.close()
          self._conn = None

    async def update_link(self, link_id, scrapped_url_hash, status, last_scraped_at):
      """
      Update the link record in the database.

      Args:
        link_id:      Primary key of the link row.
        content_hash: Hash of the scraped content.
        status:       New status (e.g. 'pending', 'done').
        last_scraped_at: Timestamp of this scrape.
      """
      
      await self.connect()
      
      try:
        await self.connect()  # Ensure connection is available
        query = """
        UPDATE link 
        SET last_scraped_at = %s, content_hash = %s, status = %s 
        WHERE id = %s;
        """
        
        async with self._conn.transaction():
          await self._conn.execute(query, (last_scraped_at, scrapped_url_hash, status, link_id))
      except Exception as e:
        logging.exception(f"Failed to update the ling {link_id}")
    
    async def get_all_links_for_campaign(self, campaign_id):
      """
      Fetch all link rows for the given campaign.

      Args:
          campaign_id: ID of the campaign to filter on.

      Returns:
          A list of dicts, one per row.
      """
        
      await self.connect()
      
      query = '''
        SELECT * FROM link
        WHERE campaign_id = %s;
      '''

      try:
        await self.connect()
        async with self._conn.cursor(row_factory=dict_row) as cur:
          await cur.execute(query)
          
          return cur.fetchall()
      except Exception as e:
        logging.exception("Failed to fetch links for campaign %d", campaign_id)
        return []

# Create a global instance
database = Database()