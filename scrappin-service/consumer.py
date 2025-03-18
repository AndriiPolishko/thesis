import json
import logging
from aiokafka import AIOKafkaConsumer
from datetime import datetime

from utils import scrape_url_and_get_text, add_protocol_if_missing, get_preprocessed_text, generate_text_hash
from db import update_link
from config import KAFKA_BROKER, KAFKA_TOPIC, KAFKA_GROUP_ID

logging.basicConfig(level=logging.INFO)

async def consume():
    """Consumes messages from Kafka and processes URLs."""

    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BROKER,
        group_id=KAFKA_GROUP_ID,
        auto_offset_reset="earliest"
    )

    await consumer.start()
    logging.info("Kafka consumer started")

    try:
        async for msg in consumer:
            message_str = msg.value.decode()

            try:
                message_obj = json.loads(message_str)
                link_id, campaign_id, url = (
                    message_obj.get("id"),
                    message_obj.get("campaignId"),
                    message_obj.get("url"),
                )

                url = add_protocol_if_missing(url)
                page_text = scrape_url_and_get_text(url)
                preprocessed_text = get_preprocessed_text(page_text)
                scrapped_url_hash = generate_text_hash(preprocessed_text)

                now = datetime.now()
                logging.info(f"Updating link {link_id} with hash {scrapped_url_hash}")

                await update_link(link_id, scrapped_url_hash, "Scrapped", now)

            except json.JSONDecodeError:
                logging.error(f"Error decoding message: {message_str}")

    finally:
        await consumer.stop()
        logging.info("Kafka consumer stopped")
