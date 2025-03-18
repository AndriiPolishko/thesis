import axios from "axios";
import { Box, Button, FormControl, FormLabel, Input, Textarea, VStack, useDisclosure, Flex, Heading } from "@chakra-ui/react";
import { ChevronDown, ChevronUp, Link, Upload } from "lucide-react";
import { useState } from "react";

export function CampaignBlock() {
  const {
    isOpen,
    onToggle
  } = useDisclosure({
    defaultIsOpen: true
  });
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [links, setLinks] = useState<string>('');

  async function handleCreateCampaign() {
    // TODO: add more validation
    if (!campaignName) {
      return;
    }

    const splittedLinks = links.split(",").map((link) => link.trim());
    // TODO: get the URL from the environment variable
    const url = 'http://localhost:3000/campaign/create'

    console.log({
      name: campaignName,
      description: campaignDescription,
      links: splittedLinks
    });

    try {
      // TODO: GENERAL fix naming in the file
      const response = await axios.post(url, {
        name: campaignName,
        goal: campaignDescription,
        urls: splittedLinks
      });
  
      // if (response.status === 201) {
      //   setCampaignName("");
      //   setCampaignDescription("");
      //   setLinks("");
      // }
    } catch (error) {
      // TODO: show error message on the UI
      console.error(error);
    }
  }

  return <Box borderWidth="1px" borderRadius="lg" bg="white" p={6}>
      <Flex justify="space-between" align="center" mb={isOpen ? 6 : 0} onClick={onToggle} cursor="pointer">
        <Heading size="md" color="gray.700">
          Campaign Creation
        </Heading>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </Flex>
      {isOpen && <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>Campaign Name</FormLabel>
            <Input 
              placeholder="Enter campaign name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Goal</FormLabel>
            <Textarea 
              placeholder="Enter campaign goal" rows={4} 
              value={campaignDescription}
              onChange={(e) => setCampaignDescription(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Add Links</FormLabel>
            <Textarea 
              placeholder="Add URL to scrape (separate by comma)" rows={2} 
              value={links}
              onChange={(e) => setLinks(e.target.value)}
            />
          </FormControl>
          <Flex gap={4}>
            <Button leftIcon={<Upload size={16} />} variant="outline" flex="1">
              Attach Files
            </Button>
            
          </Flex>
          <Button
            onClick={handleCreateCampaign}
            colorScheme="blue" 
            size="md">
            Create Campaign
          </Button>
        </VStack>}
    </Box>;
}