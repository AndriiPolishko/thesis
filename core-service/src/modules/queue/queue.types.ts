export interface GeneratedEmailMessage {
  campaign_id: number;
  lead_id: number;
  // not present
  to_email: string;
  subject: string;
  body: string;
  thread_id?: string;
  message_id?: string;
}