import { Table, Thead, Tbody, Tr, Th, Td, Box } from '@chakra-ui/react'

import { eventService } from '../../../api/eventService';
import { useEffect, useState } from 'react';

export enum EventType {
  Outgoing = 'outgoing',
  Incoming = 'incoming',
  Reply = 'reply',
  Closed = 'closed',
  Booked = 'booked',
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
  // Info from lead table
  first_name: string;
  last_name: string;
}

interface CampaignEventsTableProps {
  campaignId: number;
}

function removeTimeFromDate(dateString: string) {
  const date = new Date(dateString);

  return date.toISOString().split('T')[0];
}

export function CampaignEventsTable(params: CampaignEventsTableProps) {
  const { campaignId } = params;
  // Temporary data for demonstration
  const [events, setEvents] = useState<Event[]>([]);

  const fetchEvents = async () => {
    try {
      const {events} = await eventService.getEvents(campaignId);

      setEvents(events);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, [campaignId]);

  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" overflow="hidden">
      <Table variant="simple" size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th>Lead name</Th>
            <Th>Type</Th>
            <Th>Subject</Th>
            <Th>Body</Th>
            <Th>Date</Th>
          </Tr>
        </Thead>
        <Tbody>
          {events.map((event) => (
            <Tr key={event.id}>
              <Td>
                {event.first_name} {event.last_name}
              </Td>
              <Td>{event.type}</Td>
              <Td>{event.subject}</Td>
              <Td>{event.body}</Td>
              <Td>{removeTimeFromDate(event.created_at)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
