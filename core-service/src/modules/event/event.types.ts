export enum EventType {
  Outgoing = 'outgoing',
  Incoming = 'incoming',
  Reply = 'reply',
  Closed = 'closed',
  Booked = 'booked',
  Optout = 'opt-out'
}

export interface Event {
  id: number;
  from: string;
  to: string;
  type: EventType;
  body: string;
  subject: string;
  thread_id: string;
  lead_id: number;
  campaign_id: number;
  campaign_lead_id: number;
  message_id: string;
  created_at: string;
  updated_at: string;
}

export interface EventJoinedWithLead extends Event {
  first_name: string;
  last_name: string;
}

export interface CreateEventDto {
  from: string;
  to: string;
  type: EventType;
  body: string;
  subject: string;
  thread_id: string;
  lead_id: number;
  campaign_id: number;
  campaign_lead_id: number;
  message_id: string;
}