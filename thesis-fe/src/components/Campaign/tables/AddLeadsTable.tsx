import { useEffect, useState } from 'react'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Checkbox,
  Button,
  VStack,
  useToast
} from '@chakra-ui/react'

import { leadService } from '../../../api/leadService'
import { Lead } from '../../Lead/lead.types'

interface AddLeadsTableProps {
  onLeadsAdd: (selectedLeads: Lead[]) => void;
  campaignId: number;
}
export function AddLeadsTable(params: AddLeadsTableProps) {
  const { onLeadsAdd, campaignId } = params
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const toast = useToast();
  
  const handleSubmit = () => {
    onLeadsAdd(selectedLeads)
    setSelectedLeads([])
  }

  const fetchLeads = async () => {
    try {
      // Pass 0 for both page and size to get all leads
      const data = await leadService.getLeads({ page: 0, size: 0, campaignId });

      setLeads(data.leads);
    } catch (error: any) {
      toast({
        title: 'Failed to load leads.',
        description: error?.message || 'Something went wrong while fetching leads.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <VStack align="stretch" spacing={4}>
      <Box borderWidth="1px" borderRadius="lg" bg="white" overflow="hidden">
        <Table variant="simple" size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th width="40px">
                <Checkbox
                  isChecked={selectedLeads.length === leads.length}
                  isIndeterminate={
                    selectedLeads.length > 0 &&
                    selectedLeads.length < leads.length
                  }
                  onChange={(e) =>
                    setSelectedLeads(
                      e.target.checked ? leads : []
                    )
                  }
                />
              </Th>
              <Th>First Name</Th>
              <Th>Last Name</Th>
              <Th>Email</Th>
            </Tr>
          </Thead>
          <Tbody>
            {leads.map((lead) => (
              <Tr key={lead.id}>
                <Td>
                  <Checkbox
                    isChecked={selectedLeads.some((l) => l.id === lead.id)}
                    onChange={(e) =>
                      setSelectedLeads(
                        e.target.checked
                          ? [...selectedLeads, lead]
                          : selectedLeads.filter((l) => l.id !== lead.id)
                      )
                    }
                  />
                </Td>
                <Td>{lead.first_name}</Td>
                <Td>{lead.last_name}</Td>
                <Td>{lead.email}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      <Button
        colorScheme="blue"
        size="sm"
        isDisabled={selectedLeads.length === 0}
        onClick={handleSubmit}
      >
        Add Selected Leads
      </Button>
    </VStack>
  )
}
