import React from "react";
import { Box, Button, FormControl, FormLabel, Input, Textarea, VStack, useDisclosure, Flex, Heading } from "@chakra-ui/react";
import { ChevronDown, ChevronUp, Link, Upload } from "lucide-react";
export function CampaignBlock() {
  const {
    isOpen,
    onToggle
  } = useDisclosure({
    defaultIsOpen: true
  });
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
            <Input placeholder="Enter campaign name" />
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea placeholder="Enter campaign description" rows={4} />
          </FormControl>
          <Flex gap={4}>
            <Button leftIcon={<Upload size={16} />} variant="outline" flex="1">
              Attach Files
            </Button>
            <Button leftIcon={<Link size={16} />} variant="outline" flex="1">
              Add Links
            </Button>
          </Flex>
          <Button colorScheme="blue" size="md">
            Create Campaign
          </Button>
        </VStack>}
    </Box>;
}