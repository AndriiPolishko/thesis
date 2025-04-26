import { useEffect, useState } from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, Box, Badge, useToast, IconButton, CloseButton } from '@chakra-ui/react';
// import { CloseIcon } from '@chakra-ui/icons';

import { campaignLeadsService } from '../../../api/campaignLeads';
import { CampaignLead } from '../CampaignDetail';



interface CampaignLeadsTableProps {
  campaignLeads: CampaignLead[];
  fetchCampaignLeads: () => Promise<void>;
  fetchLeads: () => Promise<void>;
}

export function CampaignLeadsTable({ campaignLeads, fetchCampaignLeads, fetchLeads }: CampaignLeadsTableProps) {
  const toast = useToast();

  async function handleRemoveCampaignLead(campaignLeadId: number) {
    try {
      await campaignLeadsService.removeCampaignLead(campaignLeadId);
      toast({
        title: "Lead removed",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
      await fetchCampaignLeads();
      await fetchLeads();
  
      // Option B: optimistic UI
      // setCampaignLeads(current => current.filter(l => l.id !== campaignLeadId));
    } catch (err) {
      toast({
        title: "Failed to remove lead.",
        description: "Something went wrong.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right"
      });
    }
  }
  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" overflow="hidden" p={4}>
      <Table variant="simple" size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th>First Name</Th>
            <Th>Last Name</Th>
            <Th>Email</Th>
            <Th>Status</Th>
            <Th>Action</Th>
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
                <Badge 
                className='width-[100px]'
                colorScheme={campaignLead.status === 'booked' ? 'green' : 'yellow'}>
                  {campaignLead.status}
                </Badge>
              </Td>
              <Td>
                <CloseButton onClick={() => handleRemoveCampaignLead(campaignLead.id)}/>
              </Td>
            </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}
