import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
type Campaign = {
  id: string
  name: string
  goal: string
  status: 'active' | 'completed' | 'draft'
}
interface CampaignDetailProps {
  campaign: Campaign
  onBack: () => void
}
export function CampaignDetail({ campaign, onBack }: CampaignDetailProps) {
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
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Heading size="lg">{campaign.name}</Heading>
          <Badge
            colorScheme={
              campaign.status === 'active'
                ? 'green'
                : campaign.status === 'completed'
                  ? 'blue'
                  : 'gray'
            }
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
        {/* Additional campaign details can be added here */}
      </VStack>
    </Box>
  )
}
