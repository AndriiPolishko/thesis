import { Box, Flex, Text, TabList, Tab, Tabs } from '@chakra-ui/react'
import { useLocation, useNavigate } from 'react-router-dom'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const getTabIndex = () => {
    switch (location.pathname) {
      case '/campaigns/create':
        return 0
      case '/campaigns':
        return 1
      case '/leads/create':
        return 2
      case '/leads':
        return 3
      default:
        return 0
    }
  }
  const handleTabChange = (index: number) => {
    switch (index) {
      case 0:
        navigate('/campaigns/create')
        break
      case 1:
        navigate('/campaigns')
        break
      case 2:
        navigate('/leads/create')
        break
      case 3:
        navigate('/leads')
        break
    }
  }
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
        <Tabs index={getTabIndex()} onChange={handleTabChange}>
          <TabList
            px={8}
            mb="-1px"
          >
            <Tab>Campaign Creation</Tab>
            <Tab>View Campaigns</Tab>
            <Tab>Lead Creation</Tab>
            <Tab>View Leads</Tab>
          </TabList>
        </Tabs>
      </Flex>
    </Box>
  )
}
