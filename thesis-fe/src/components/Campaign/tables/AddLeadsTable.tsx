import React, { useState } from 'react'
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
type Lead = {
  id: string
  name: string
  email: string
}
interface AddLeadsTableProps {
  onLeadsAdd: (selectedLeads: string[]) => void
}
export function AddLeadsTable({ onLeadsAdd }: AddLeadsTableProps) {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  // Temporary data for demonstration
  const availableLeads: Lead[] = [
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
    },
    {
      id: '4',
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
    },
    {
      id: '5',
      name: 'Tom Brown',
      email: 'tom@example.com',
    },
  ]
  const handleSubmit = () => {
    onLeadsAdd(selectedLeads)
    setSelectedLeads([])
  }
  return (
    <VStack align="stretch" spacing={4}>
      <Box borderWidth="1px" borderRadius="lg" bg="white" overflow="hidden">
        <Table variant="simple" size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th width="40px">
                <Checkbox
                  isChecked={selectedLeads.length === availableLeads.length}
                  isIndeterminate={
                    selectedLeads.length > 0 &&
                    selectedLeads.length < availableLeads.length
                  }
                  onChange={(e) =>
                    setSelectedLeads(
                      e.target.checked
                        ? availableLeads.map((lead) => lead.id)
                        : [],
                    )
                  }
                />
              </Th>
              <Th>Name</Th>
              <Th>Email</Th>
            </Tr>
          </Thead>
          <Tbody>
            {availableLeads.map((lead) => (
              <Tr key={lead.id}>
                <Td>
                  <Checkbox
                    isChecked={selectedLeads.includes(lead.id)}
                    onChange={(e) =>
                      setSelectedLeads(
                        e.target.checked
                          ? [...selectedLeads, lead.id]
                          : selectedLeads.filter((id) => id !== lead.id),
                      )
                    }
                  />
                </Td>
                <Td>{lead.name}</Td>
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
