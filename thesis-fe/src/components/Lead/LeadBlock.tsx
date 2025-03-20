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
} from "@chakra-ui/react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function LeadBlock() {
  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: true,
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
          Lead Management
        </Heading>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </Flex>
      {isOpen && (
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>Lead Name</FormLabel>
            <Input placeholder="Enter lead name" />
          </FormControl>
          <FormControl>
            <FormLabel>Email Address</FormLabel>
            <Input type="email" placeholder="Enter email address" />
          </FormControl>
          <Button colorScheme="blue" size="md">
            Add Lead
          </Button>
        </VStack>
      )}
    </Box>
  );
}
