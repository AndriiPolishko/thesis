import psycopg as pg
import logging

from config.config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
from models.models import LinkStatusEnum

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

    async def update_link(self, link_id, scrapped_url_hash, status, timestamp):
        """Updates the link record in the database."""
        try:
            await self.connect()  # Ensure connection is available
            query = """
            UPDATE link 
            SET last_scraped_at = %s, content_hash = %s, status = %s 
            WHERE id = %s;
            """
            async with self.conn.cursor() as cur:
                await cur.execute(query, (timestamp, scrapped_url_hash, status, link_id))
                await self.conn.commit()
        except Exception as e:
            print(e)
    
    async def get_all_links(self):
        """Fetches all links from the database."""
        query = "SELECT * FROM link;"

        try:
            await self.connect()  # Ensure connection is available
            async with self.conn.cursor() as cur:
                await cur.execute(query)
                
                rows = await cur.fetchall()
                columns = [desc[0] for desc in cur.description]

                return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            print(e)
        finally:
            await self.close()

# Create a global instance
database = Database()