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
} from '@chakra-ui/react'

import { Lead } from '../../Lead/lead.types'

interface AddLeadsTableProps {
  onLeadsAdd: (selectedLeads: Lead[]) => void;
  fetchLeads: () => Promise<void>;
  leads: Lead[];
}
export function AddLeadsTable(params: AddLeadsTableProps) {
  const { onLeadsAdd, fetchLeads, leads } = params
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([])
  
  const handleSubmit = () => {
    onLeadsAdd(selectedLeads)
    setSelectedLeads([])
  }
  


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
