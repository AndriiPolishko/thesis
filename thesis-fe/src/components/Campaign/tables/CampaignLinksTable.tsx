import { Table, Thead, Tbody, Tr, Th, Td, Box, Link } from '@chakra-ui/react';

import { CampaignLink } from '../CampaignDetail';

interface CampaignLinksTableProps {
  links: CampaignLink[];
}

function formatDate(date: Date | null) {
  return date ? date.toISOString().split('T')[0] : '-';
}

export function CampaignLinksTable({ links }: CampaignLinksTableProps) {
  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" overflow="hidden">
      <Table variant="simple" size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th>URL</Th>
            <Th>Status</Th>
            <Th>Last Scrapped At</Th>
          </Tr>
        </Thead>
        <Tbody>
          {links?.map((link) => (
            <Tr key={link.id}>
              <Td>
                <Link href={link.url} color="blue.500" isExternal>
                  {link.url}
                </Link>
              </Td>
              <Td>{link.status}</Td>
              <Td>{formatDate(link.last_scraped_at)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
