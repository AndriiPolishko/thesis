from fastapi import APIRouter, FastAPI
from pydantic import BaseModel
from typing import Optional

import uvicorn
from contextlib import asynccontextmanager
import asyncio
import json


from config import HOST, PORT
from sqs_queue.consumer import email_creation_consumer
from sqs_queue.producer import email_producer
from database.db import database
# TODO: remove after testing
from services.email_generation import email_generation

router = APIRouter()

# TODO: remove after testing
class EmailGenerationMessage(BaseModel):
  campaign_id: int
  lead_id: int
  campaign_goal: str
  first_name: str
  last_name: str
  thread_id: Optional[str] = None
  thread: Optional[str] = None
  last_message: Optional[str] = None
  message_id: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
  # initialize email generation consumer
  await email_producer.initialize()
  
  consumer_task = asyncio.create_task(email_creation_consumer.consume())
  
  yield
  
  # Stop the consumer and producer
  consumer_task.cancel()
  await email_producer.stop()
  # Stop the database connection
  await database.close()


@router.get("/")
async def root():
  return 'OK'

@router.get('/test')
async def test():
  thread = '''
  ok so what is the price?
  On Sat, Apr 12, 2025 at 9:46 PM Андрій Полішко <andrii.polishko@ucu.edu.ua> wrote:
What is the price of your product?

On Fri, Apr 11, 2025 at 3:55 PM <andrii.again@gmail.com> wrote:
Subject: Re: Exciting Opportunity for Your Work Enhancement

Hi Andrii,

Thank you for your interest! I'm thrilled to share more details about
our innovative solution tailored specifically for your needs. Our
product is designed to [describe specific benefit related to Andrii’s
industry or interests], providing you with [mention any feature that
adds significant value, e.g., efficiency, cost-saving, etc.].

During our exclusive trial period, you'll have access to:

1. **Full Product Features**: Experience the complete range of
functionalities that make our solution stand out.
2. **Personalized Support**: Our team is on hand to ensure you get the
most out of your trial experience.
3. **No-risk Exploration**: Enjoy the benefits with no obligations,
ensuring that it's a perfect fit for your needs.

I would love to set up a quick call to discuss how we can customize
this experience for you and answer any questions you might have.
Please let me know when you're available for a chat, and we can
schedule a convenient time.

Looking forward to the opportunity of collaborating with you and
enhancing your work processes.

Best regards,

[Your Name]
[Your Position]
[Your Company's Name]
[Your Contact Information]
[Company Website]
'''
  message = {
    "campaign_id": 1,
    "lead_id": 1,
    "campaign_goal": "Test",
    "first_name": "John",
    "last_name": "Doe",
    "thread_id": '12345',
    "thread": thread,
    "message_id": '12345'
  }
  
  message = EmailGenerationMessage(**message)
  await email_generation.handle_reply(message)

app = FastAPI(lifespan=lifespan)

app.include_router(router)
  
if __name__ == '__main__':
  print(f"Starting server at {HOST}:{PORT}")
  
  uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
