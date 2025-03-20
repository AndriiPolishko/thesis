import { useEffect, useState } from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, Box, Badge, Button, Input, useToast } from '@chakra-ui/react';
import { campaignLeadsService } from '../../../api/campaignLeads';
import { useMutation } from '@tanstack/react-query';

interface CampaignLead {
  id: number;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface CampaignLeadsTableProps {
  campaignId: number;
}

export function CampaignLeadsTable({ campaignId }: CampaignLeadsTableProps) {
  const [campaignLeads, setCampaignLeads] = useState<CampaignLead[]>([]);
  const toast = useToast();

  useEffect(() => {
    fetchLeads();
  }, [campaignId]);

  const fetchLeads = async () => {
    try {
      const data = await campaignLeadsService.getCampaignLeads(campaignId);
      setCampaignLeads(data.campaignLeads || []);
    } catch (error) {
      console.error('Error fetching campaign leads:', error);
    }
  };

  const addCampaignLeadMutation = useMutation({
    mutationFn: campaignLeadsService.createCampaignLead,
    onSuccess: () => {
      toast({
        title: "Campaign Created",
        description: "Your campaign has been successfully created.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });

    },
    onError: (error) => {
      toast({
        title: "Campaign Creation Failed",
        description: error?.message || "Something went wrong. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
    },
  });

  // const handleAddLead = async () => {
  //   addCampaignLeadMutation.mutate({ campaignId, leadId: Number(newLeadId) });
  // };

  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" overflow="hidden" p={4}>
      <Table variant="simple" size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th>First Name</Th>
            <Th>Last Name</Th>
            <Th>Email</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {campaignLeads.map((campaignLead) => {
            return (
              <Tr key={campaignLead.id}>
              <Td>{campaignLead?.first_name}</Td>
              <Td>{campaignLead?.last_name}</Td>
              <Td>{campaignLead?.email}</Td>
              <Td>
                <Badge colorScheme={campaignLead.status === 'Engaged' ? 'green' : 'yellow'}>
                  {campaignLead.status}
                </Badge>
              </Td>
            </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}
