import { useEffect, useState } from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, Box, Badge, Select, Button } from '@chakra-ui/react';
import { campaignService } from '../../api/campaignService';

// Define the Campaign type
interface Campaign {
  id: string;
  name: string;
  goal: string;
  status: 'active' | 'completed' | 'draft';
}

interface CampaignTableProps {
  onCampaignSelect: (campaign: Campaign) => void;
}

export function CampaignTable({ onCampaignSelect }: CampaignTableProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCampaigns();
  }, [page, size]);

  const fetchCampaigns = async () => {
    try {
      const data = await campaignService.getCampaigns({ page, size });

      console.log(data);

      setCampaigns(data.campaigns);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'completed':
        return 'blue';
      case 'draft':
        return 'gray';
      default:
        return 'gray';
    }
  };

  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" overflow="hidden" p={4}>
      <Box display="flex" justifyContent="space-between" mb={4}>
        <Select value={size} onChange={(e) => setSize(Number(e.target.value))} w="150px">
          {[5, 10, 20, 50, 100].map((num) => (
            <option key={num} value={num}>{num} per page</option>
          ))}
        </Select>
      </Box>
      <Table variant="simple">
        <Thead bg="gray.50">
          <Tr>
            <Th>Name</Th>
            <Th>Goal</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {campaigns.map((campaign) => (
            <Tr
              key={campaign.id}
              cursor="pointer"
              _hover={{ bg: 'gray.50' }}
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
      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} isDisabled={page === 1}>
          Previous
        </Button>
        <Box>Page {page} of {totalPages}</Box>
        <Button onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} isDisabled={page === totalPages}>
          Next
        </Button>
      </Box>
    </Box>
  );
}
