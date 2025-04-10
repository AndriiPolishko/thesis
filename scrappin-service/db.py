import psycopg as pg
import logging

from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS

logging.basicConfig(level=logging.INFO)

class LinkStatusEnum:
    """Enum for link status."""
    Scrapped = "Scrapped"
    Processing = "Processing"
    Embedded = "Embedded"
    Error = "Error"

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

    async def save_link(self, url, campaign_id):
        """Saves the link to the database."""
        try:
            await self.connect()  # Ensure connection is available
            query = """
            INSERT INTO link (url, campaign_id,status) 
            VALUES (%s, %s, %s) 
            RETURNING id;
            """
            async with self.conn.cursor() as cur:
                await cur.execute(query, (url, campaign_id, LinkStatusEnum.Processing))
                link_id = await cur.fetchone()
                await self.conn.commit()
                return link_id[0] if link_id else None
        except Exception as e:
            print(e)

    async def update_link(self, link_id, scrapped_url_hash, status, timestamp):
        """Updates the link record in the database."""
        try:
            await self.connect()  # Ensure connection is available
            query = """
            UPDATE link 
            SET last_scrapped = %s, scrapped_url_hash = %s, status = %s 
            WHERE id = %s;
            """
            async with self.conn.cursor() as cur:
                await cur.execute(query, (timestamp, scrapped_url_hash, status, link_id))
                await self.conn.commit()
        except Exception as e:
            print(e)

    async def update_campaign_status(self, campaign_id, status):
        """Updates the campaign status in the database."""
        try:
            await self.connect()  # Ensure connection is available
            query = """
            UPDATE campaign 
            SET status = %s 
            WHERE id = %s;
            """
            async with self.conn.cursor() as cur:
                await cur.execute(query, (status, campaign_id))
                await self.conn.commit()
        except Exception as e:
            print(e)

# Create a global instance
database = Database()