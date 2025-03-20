import React from 'react'
import { Table, Thead, Tbody, Tr, Th, Td, Box, Badge } from '@chakra-ui/react'
type Event = {
  id: string
  date: string
  type: string
  description: string
  status: string
}
export function CampaignEventsTable() {
  // Temporary data for demonstration
  const events: Event[] = [
    {
      id: '1',
      date: '2024-01-15',
      type: 'Email',
      description: 'Welcome Email Sent',
      status: 'Completed',
    },
    {
      id: '2',
      date: '2024-01-18',
      type: 'Follow-up',
      description: 'Reminder Email Scheduled',
      status: 'Pending',
    },
  ]
  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" overflow="hidden">
      <Table variant="simple" size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th>Date</Th>
            <Th>Type</Th>
            <Th>Description</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {events.map((event) => (
            <Tr key={event.id}>
              <Td>{event.date}</Td>
              <Td>{event.type}</Td>
              <Td>{event.description}</Td>
              <Td>
                <Badge
                  colorScheme={
                    event.status === 'Completed' ? 'green' : 'yellow'
                  }
                >
                  {event.status}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
