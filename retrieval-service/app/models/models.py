from pydantic import BaseModel
from typing import Optional

# Interface for a received email generation message 
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
  campaign_system_prompt: Optional[str] = None