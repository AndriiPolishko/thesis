import { Table, Thead, Tbody, Tr, Th, Td, Box } from '@chakra-ui/react'

export function LeadTable() {
  // Temporary data for demonstration
  const dummyLeads = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      status: 'New',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'Contacted',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      status: 'Qualified',
    },
  ]
  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" overflow="hidden">
      <Table variant="simple">
        <Thead bg="gray.50">
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {dummyLeads.map((lead) => (
            <Tr key={lead.id}>
              <Td>{lead.name}</Td>
              <Td>{lead.email}</Td>
              <Td>{lead.status}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
