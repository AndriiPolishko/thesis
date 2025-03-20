import { Box, Flex, Text, TabList, Tab } from '@chakra-ui/react'
interface HeaderProps {
  tabIndex: number
  onChange: (index: number) => void
}
export function Header(props: HeaderProps) {
  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex="sticky"
      bg="white"
      borderBottom="1px"
      borderColor="gray.200"
      shadow="sm"
    >
      <Flex direction="column" maxW="100%" mx="auto">
        <Box px={8} py={4}>
          <Text fontSize="xl" fontWeight="bold" color="blue.600">
            Mail Automation
          </Text>
        </Box>
        <TabList px={8} mb="-1px">
          <Tab>Campaign Creation</Tab>
          <Tab>View Campaigns</Tab>
          <Tab>Lead Creation</Tab>
          <Tab>View Leads</Tab>
        </TabList>
      </Flex>
    </Box>
  )
}
