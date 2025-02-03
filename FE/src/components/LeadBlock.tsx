import { useState } from "react";
import { Box, Button, FormControl, FormLabel, Input, VStack, useDisclosure, Flex, Heading } from "@chakra-ui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";

export function LeadBlock() {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });

  // State hooks to store input field values.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const addLead = async () => {
    // Prepare the data to send to the backend
    const leadData = { firstName, lastName, email };
    try {
      // Replace the URL with your backend endpoint for lead creation
      const response = await axios.post("https://example.com/api/leads", leadData);
      console.log("Lead created successfully:", response.data);
      // Optionally, you can reset the fields after a successful submission:
      setFirstName("");
      setLastName("");
      setEmail("");
    } catch (error) {
      console.error("Error creating lead:", error);
    }
  };

  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" p={6}>
      <Flex justify="space-between" align="center" mb={isOpen ? 6 : 0} onClick={onToggle} cursor="pointer">
        <Heading size="md" color="gray.700">
          Lead Management
        </Heading>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </Flex>
      {isOpen && (
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>First Name</FormLabel>
            <Input
              placeholder="Enter first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Last Name</FormLabel>
            <Input
              placeholder="Enter last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Email Address</FormLabel>
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>
          <Button colorScheme="blue" size="md" onClick={addLead}>
            Add Lead
          </Button>
        </VStack>
      )}
    </Box>
  );
}
