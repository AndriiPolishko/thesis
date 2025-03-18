import axios from "axios";
import { Box, VStack, useDisclosure, Flex, Heading } from "@chakra-ui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

export function ExistingCampaigns() {
  const {
    isOpen,
    onToggle
  } = useDisclosure({
    defaultIsOpen: true
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await axios.get("https://example.com/api/campaigns");
        
        setCampaigns(response.data);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      }
    };

    fetchCampaigns();
  });

  return <Box borderWidth="1px" borderRadius="lg" bg="white" p={6}>
      <Flex justify="space-between" align="center" mb={isOpen ? 6 : 0} onClick={onToggle} cursor="pointer">
        <Heading size="md" color="gray.700">
          Active Campaigns
        </Heading>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </Flex>
      {isOpen && <VStack spacing={4} align="stretch">
          
        </VStack>}
    </Box>;
}