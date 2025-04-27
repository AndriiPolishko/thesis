import { Table, Thead, Tbody, Tr, Th, Td, Box, Link } from '@chakra-ui/react';

import { CampaignLink } from '../CampaignDetail';

interface CampaignLinksTableProps {
  links: CampaignLink[];
}

function formatDate(isoString: string | null) {
  if (!isoString) {
    return 'N/A';
  }

  const date = new Date(isoString);

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  return date.toLocaleString(undefined, options);
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
