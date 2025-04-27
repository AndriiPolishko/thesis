import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Box, Button, FormControl, FormLabel, Input, Textarea, VStack, Flex, Heading, useToast 
} from "@chakra-ui/react";

import { campaignService } from "../../api/campaignService";

export function CampaignBlock() {
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [links, setLinks] = useState<string>("");
  const [campaignSystemPrompt, setCampaignSystemPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast(); // Chakra UI toast for notifications
  const mutation = useMutation({
    mutationFn: campaignService.createCampaign,
    onSuccess: () => {
      setIsSubmitting(false);
      toast({
        title: "Campaign Created",
        description: "Your campaign has been successfully created.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });

      // Clear fields after successful submission
      setCampaignName("");
      setCampaignDescription("");
      setLinks("");
      setCampaignSystemPrompt("");
    },
    onError: (error) => {
      setIsSubmitting(false);
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

  async function handleCreateCampaign() {
    if (!campaignName.trim()) {
      toast({
        title: "Validation Error",
        description: "Campaign name is required.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
      return;
    }

    setIsSubmitting(true);

    const splittedLinks = links.split(', ').map(link => link.trim()).filter(link => link !== "");

    try {
      mutation.mutate({ campaignName, campaignDescription, splittedLinks, campaignSystemPrompt });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" p={6}>
      <Flex justify="space-between" align="center" mb={6} cursor="pointer">
        <Heading size="md" color="gray.700">
          Campaign Creation
        </Heading>
      </Flex>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Campaign Name</FormLabel>
          <Input 
            placeholder="Enter campaign name"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            isDisabled={isSubmitting}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Goal</FormLabel>
          <Textarea 
            placeholder="Enter campaign goal" rows={4} 
            value={campaignDescription}
            onChange={(e) => setCampaignDescription(e.target.value)}
            isDisabled={isSubmitting}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Add Links</FormLabel>
          <Textarea 
            placeholder="Add URL to scrape (separate by comma)" rows={2} 
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            isDisabled={isSubmitting}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Campaign system prompt</FormLabel>
          <Textarea 
            placeholder="Add system prompt for the campaign" rows={2} 
            value={campaignSystemPrompt}
            onChange={(e) => setCampaignSystemPrompt(e.target.value)}
            isDisabled={isSubmitting}
          />
        </FormControl>
        <Button
          onClick={handleCreateCampaign}
          colorScheme="blue"
          size="md"
          isLoading={isSubmitting}
        >
          Create Campaign
        </Button>
      </VStack>
    </Box>
  );
}
