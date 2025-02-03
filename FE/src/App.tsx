import React from "react";
import { Box, Container, Heading, VStack } from "@chakra-ui/react";
import { CampaignBlock } from "./components/CampaignBlock";
import { LeadBlock } from "./components/LeadBlock";
export function App() {
  return <Box w="100%" minH="100vh" bg="gray.50" py={8}>
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          <Heading size="lg" color="gray.700">
            Mail Automation Dashboard
          </Heading>
          <CampaignBlock />
          <LeadBlock />
        </VStack>
      </Container>
    </Box>;
}