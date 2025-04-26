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
import { useEffect, useState } from 'react';
import { leadService } from '../../api/leadService';

export interface CampaignLead {
  id: number;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
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
  const [campaignLeads, setCampaignLeads] = useState<CampaignLead[]>([]);
  const [leads, setLeads] = useState<Lead[]>([])


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
    onSuccess: async () => {
      toast({
        title: "Campaign Created",
        description: "Your campaign has been successfully created.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });

      await fetchCampaignLeads();
      await fetchLeads();
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
    await addCampaignLeadMutation.mutate({ campaignId, leadIds });

    fetchLeads();
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

  const fetchCampaignLeads = async () => {
    try {
      const data = await campaignLeadsService.getCampaignLeads(campaignId);
      setCampaignLeads(data.campaignLeads || []);
    } catch (error) {
      toast({
        title: "Failed to campaign load leads.",
        description: "Something went wrong while fetching campaign leads.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right"
      });
    }
  };

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
    fetchCampaignLeads();
  }, [campaignId]);

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
          <CampaignLeadsTable campaignLeads={campaignLeads} fetchCampaignLeads={fetchCampaignLeads} fetchLeads={fetchLeads}/>
        </VStack>
        <VStack align="stretch" spacing={4}>
          <Heading size="md">Add Leads</Heading>
          <AddLeadsTable onLeadsAdd={handleLeadsAdd}  leads={leads} fetchLeads={fetchLeads}/>
        </VStack>
        <Divider />
        <VStack align="stretch" spacing={4}>
          <Heading size="md">Campaign Events</Heading>
          <CampaignEventsTable campaignId={campaignId} />
        </VStack>
      </VStack>
    </Box>
  )
}
