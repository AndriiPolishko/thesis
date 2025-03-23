import { Flex, Spinner } from "@chakra-ui/react";

export function CenterSpinner() {
  return (
    <Flex
      height="100vh"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
    >
      <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
    </Flex>
  );
}
