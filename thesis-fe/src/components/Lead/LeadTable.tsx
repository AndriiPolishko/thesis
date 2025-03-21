import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Button,
  Select,
  useToast
} from '@chakra-ui/react'
import { useEffect, useState } from 'react';

import { leadService } from '../../api/leadService';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
}

export function LeadTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const toast = useToast();

  useEffect(() => {
    fetchLeads();
  }, [page, size]);

  const fetchLeads = async () => {
    try {
      const data = await leadService.getLeads({ page, size });

      setLeads(data.leads);
      setTotalPages(data.totalPages);
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

  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" overflow="hidden">
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
            <Th>First Name</Th>
            <Th>Last Name</Th>
            <Th>Email</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {leads.map((lead) => (
            <Tr key={lead.id}>
              <Td>{lead.first_name}</Td>
              <Td>{lead.last_name}</Td>
              <Td>{lead.email}</Td>
              <Td>{lead.status}</Td>
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
