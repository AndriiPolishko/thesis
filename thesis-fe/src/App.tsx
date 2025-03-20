import { Box, Tabs } from '@chakra-ui/react'

import { Navigation } from './components/Navigation/Navigation'
import { Header } from './components/Header/Header'

export function App() {
  return (
    <Tabs variant="enclosed" colorScheme="blue" w="100%">
      <Box w="100%" minH="100vh" bg="gray.50">
        <Header tabIndex={0} onChange={() => {}} />
        <Box maxW="container.lg" mx="auto" py={8} px={4}>
          <Navigation />
        </Box>
      </Box>
    </Tabs>
  )
}
