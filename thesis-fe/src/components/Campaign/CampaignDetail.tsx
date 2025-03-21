import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Divider
} from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import { CampaignLeadsTable } from './tables/CampaignLeadsTable'
import { AddLeadsTable } from './tables/AddLeadsTable'
import { CampaignEventsTable } from './tables/CampaignEventsTable'

enum CampaignStatus {
  Pending = 'Pending',
  DataCollected = 'Data Collected',
  Ready = 'Ready',
  Active = 'Active',
  Inactive = 'Inactive',
}

type Campaign = {
  id: number
  name: string
  goal: string
  status: CampaignStatus
}

interface CampaignDetailProps {
  campaign: Campaign
  onBack: () => void
}
export function CampaignDetail({ campaign, onBack }: CampaignDetailProps) {
  const campaignId = campaign.id;
  const handleLeadsAdd = (selectedLeads: string[]) => {
    // Handle adding leads to the campaign
  }
  const canStartCampaign = campaign.status === CampaignStatus.Ready;

  function chooseStatusColor(status: CampaignStatus) {
    switch (status) {
      case CampaignStatus.Active:
        return 'green';
      case CampaignStatus.Inactive:
        return 'gray';
      case CampaignStatus.DataCollected:
        return 'blue';
      case CampaignStatus.Ready:
        return 'yellow';
      case CampaignStatus.Pending:
        return 'gray';
      default:
        return 'gray';
      }
  }

  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" p={6}>
      <Button
        leftIcon={<ArrowLeft size={16} />}
        variant="ghost"
        mb={6}
        onClick={onBack}
      >
        Back to Campaigns
      </Button>
      <VStack align="stretch" spacing={8}>
        <HStack justify="space-between">
        <VStack>
          <HStack justify="space-between">
            <Heading size="lg">{campaign.name}</Heading>
            {canStartCampaign && (
              <Button colorScheme="blue" size="md">
                Start Campaign
              </Button>
            )}
          </HStack>
        </VStack>
        <Badge
          colorScheme={chooseStatusColor(campaign.status)}
          fontSize="md"
          px={3}
          py={1}
        >
          {campaign.status}
        </Badge>
        </HStack>
        <Box>
          <Text fontWeight="bold" mb={2}>
            Campaign Goal
          </Text>
          <Text>{campaign.goal}</Text>
        </Box>
        <Divider/>
        <VStack align="stretch" spacing={4}>
          <Heading size="md">Campaign Leads</Heading>
          <CampaignLeadsTable campaignId={campaignId} />
        </VStack>
        <VStack align="stretch" spacing={4}>
          <Heading size="md">Add Leads</Heading>
          <AddLeadsTable onLeadsAdd={handleLeadsAdd} />
        </VStack>
        <Divider />
        <VStack align="stretch" spacing={4}>
          <Heading size="md">Campaign Events</Heading>
          <CampaignEventsTable />
        </VStack>
      </VStack>
    </Box>
  )
}
