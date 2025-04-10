import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  useToast
} from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query';

import { CampaignLeadsTable } from './tables/CampaignLeadsTable'
import { AddLeadsTable } from './tables/AddLeadsTable'
import { CampaignEventsTable } from './tables/CampaignEventsTable'
import { campaignService } from '../../api/campaignService'
import { CenterSpinner } from '../Utils/CenterSpinner';
import { CampaignStatus } from '../../api/campaignService';
import { Lead } from '../Lead/lead.types';
import { campaignLeadsService } from '../../api/campaignLeads';

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
export function CampaignDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const campaignId = Number(id);
  const toast = useToast();
  const {
    data: campaign,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignService.getCampaignById(campaignId),
    // prevent running if `id` is undefined
    enabled: !!campaignId, 
  });

  const canChangeCampaignStatus = campaign?.status === CampaignStatus.Inactive || campaign?.status === CampaignStatus.Active;
  const changeCampaignStatusButtonText = 
    campaign?.status === CampaignStatus.Active
     ? "Pause Campaign" : "Active Campaign";
  const changeCampaignStatusButtonTextColor =
    campaign?.status === CampaignStatus.Active
      ? "red" : "green";
  const changeCampaignStatusMutation = useMutation({
    mutationFn: (params: { campaignId: number, newStatus: CampaignStatus }) => 
      campaignService.changeCampaignStatus(params),
    onSuccess: () => {
      // oast({ title: 'Status updated', status: 'success' });
      refetch(); // ✅ refetch updated campaign
    },
    onError: () => {
      // toast({ title: 'Failed to update status', status: 'error' });
    }
  });

  const addCampaignLeadMutation = useMutation({
    mutationFn: campaignLeadsService.addCampaignLeads,
    onSuccess: () => {
      toast({
        title: "Campaign Created",
        description: "Your campaign has been successfully created.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });

    },
    onError: (error) => {
      toast({
        title: "Campaign Creation Failed",
        description: error?.message || "Something went wrong. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
    },
  });
  async function handleLeadsAdd(leads: Lead[]) {
    const leadIds = leads.map((lead) => lead.id);
    addCampaignLeadMutation.mutate({ campaignId, leadIds });
  }

  function chooseStatusColor(status: CampaignStatus) {
    switch (status) {
      case CampaignStatus.Active:
        return 'green';
      case CampaignStatus.Inactive:
        return 'red';
      case CampaignStatus.Pending:
        return 'blue';
      default:
        return 'gray';
      }
  }
  async function handleCampaignStart() {
    const newStatus = campaign?.status === CampaignStatus.Active ? 
      CampaignStatus.Inactive : CampaignStatus.Active;
    changeCampaignStatusMutation.mutate({ campaignId, newStatus });
  }

  function onBack() {
    navigate('/campaigns');
  }

  if (isLoading) {
    return <CenterSpinner />
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
            <Heading size="lg">{campaign?.name}</Heading>
            <Button 
              colorScheme={canChangeCampaignStatus ? changeCampaignStatusButtonTextColor : "gray"}
              border={`1px solid ${canChangeCampaignStatus ? changeCampaignStatusButtonTextColor : "gray"}`}
              disabled={!canChangeCampaignStatus}
              size="md"
              onClick={handleCampaignStart}
            >
                {changeCampaignStatusButtonText}
              </Button>
          </HStack>
        </VStack>
        <Badge
          colorScheme={chooseStatusColor(campaign?.status)}
          fontSize="md"
          px={3}
          py={1}
        >
          {campaign?.status}
        </Badge>
        </HStack>
        <Box>
          <Text fontWeight="bold" mb={2}>
            Campaign Goal
          </Text>
          <Text>{campaign?.goal}</Text>
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
