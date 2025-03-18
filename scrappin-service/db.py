import psycopg as pg
from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS

async def connect_to_db():
    """Creates and returns a database connection."""
    connection_string = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    return await pg.AsyncConnection.connect(conninfo=connection_string)

async def update_link(link_id, scrapped_url_hash, status, timestamp):
    """Updates the link record in the database."""
    aconn = await connect_to_db()
    query = """
    UPDATE link 
    SET last_scrapped = %s, scrapped_url_hash = %s, status = %s 
    WHERE id = %s;
    """
    await aconn.execute(query, (timestamp, scrapped_url_hash, status, link_id))
    await aconn.commit()