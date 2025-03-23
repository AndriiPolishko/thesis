import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useDisclosure,
  Flex,
  Heading,
  useToast,
} from "@chakra-ui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { leadService } from "../../api/leadService";

export function LeadBlock() {
  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: true,
  });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleCreateLead = async () => {
    if (!email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email address is required.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });

      return;
    }

    setIsSubmitting(true);
    
    try {
      mutation.mutate({ firstName, lastName, email });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toast = useToast(); // Chakra UI toast for notifications
  const mutation = useMutation({
    mutationFn: leadService.createLead,
    onSuccess: () => {
      setIsSubmitting(false);
      toast({
        title: "Lead Created",
        description: `Lead ${firstName} ${lastName} has been successfully created.`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });

      // Clear fields after successful submission
      setFirstName("");
      setLastName("");
      setEmail("");
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Lead Creation Failed",
        description: error?.message || "Something went wrong. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
    },
  });

  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" p={6}>
      <Flex
        justify="space-between"
        align="center"
        mb={isOpen ? 6 : 0}
        onClick={onToggle}
        cursor="pointer"
      >
        <Heading size="md" color="gray.700">
          Lead Creation
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
              placeholder="Enter Last name"
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
          <Button
            onClick={handleCreateLead}
            colorScheme="blue" 
            size="md"
          >
            Add Lead
          </Button>
        </VStack>
      )}
    </Box>
  );
}
