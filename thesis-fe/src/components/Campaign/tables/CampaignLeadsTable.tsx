import { Table, Thead, Tbody, Tr, Th, Td, Box, Badge, CloseButton } from '@chakra-ui/react';

import { campaignLeadsService } from '../../../api/campaignLeads';
import { CampaignLead } from '../CampaignDetail';
import { toastHook } from '../../hooks/toast-hook';

interface CampaignLeadsTableProps {
  campaignLeads: CampaignLead[];
  fetchCampaignLeads: () => Promise<void>;
  fetchLeads: () => Promise<void>;
}

export function CampaignLeadsTable({ campaignLeads, fetchCampaignLeads, fetchLeads }: CampaignLeadsTableProps) {
  const toastWrapper = toastHook();

  async function handleRemoveCampaignLead(campaignLeadId: number) {
    try {
      await campaignLeadsService.removeCampaignLead(campaignLeadId);

      toastWrapper({title: "Lead removed", status: "success"});
     
      await fetchCampaignLeads();
      await fetchLeads();
    } catch (err) {
      toastWrapper({title: "Failed to remove lead", status: "error"});
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
                colorScheme={campaignLead.status === 'booked' ? 'green' : 'orange'}
                p="5px"
                textAlign="center"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="md"
                >
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
