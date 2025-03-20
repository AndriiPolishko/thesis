import { Table, Thead, Tbody, Tr, Th, Td, Box, Badge } from '@chakra-ui/react'
type Campaign = {
  id: string
  name: string
  goal: string
  status: 'active' | 'completed' | 'draft'
}
interface CampaignTableProps {
  campaigns: Campaign[]
  onCampaignSelect: (campaign: Campaign) => void
}
export function CampaignTable({
  campaigns,
  onCampaignSelect,
}: CampaignTableProps) {
  // Temporary data for demonstration
  const dummyCampaigns: Campaign[] = [
    {
      id: '1',
      name: 'Summer Sale 2024',
      goal: 'Increase Sales',
      status: 'active',
    },
    {
      id: '2',
      name: 'Newsletter Q1',
      goal: 'Lead Nurturing',
      status: 'completed',
    },
    {
      id: '3',
      name: 'Product Launch',
      goal: 'Brand Awareness',
      status: 'draft',
    },
  ]
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'green'
      case 'completed':
        return 'blue'
      case 'draft':
        return 'gray'
    }
  }
  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" overflow="hidden">
      <Table variant="simple">
        <Thead bg="gray.50">
          <Tr>
            <Th>Name</Th>
            <Th>Goal</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {dummyCampaigns.map((campaign) => (
            <Tr
              key={campaign.id}
              cursor="pointer"
              _hover={{
                bg: 'gray.50',
              }}
              onClick={() => onCampaignSelect(campaign)}
            >
              <Td>{campaign.name}</Td>
              <Td>{campaign.goal}</Td>
              <Td>
                <Badge colorScheme={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
