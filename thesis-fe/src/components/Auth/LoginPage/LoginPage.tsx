import axios from 'axios';
import { Box, Button, VStack, Heading, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

import { useAuth } from '../../../contexts/AuthContext';

// FIXME: fix the image getting
// import { ReactComponent as GoogleIcon } from './images/google.svg'

export function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8001/auth/google/login';
  }

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate(); 

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/campaigns/create');
    }
  }, [isAuthenticated]);

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
    >
      <VStack
        spacing={8}
        p={8}
        borderRadius="lg"
        bg="white"
        shadow="lg"
        maxW="md"
        w="full"
      >
        <VStack spacing={3}>
          <Heading size="xl" color="blue.600">
            Mail Automation
          </Heading>
          <Text color="gray.600" textAlign="center">
            Streamline your business communication
          </Text>
        </VStack>
        <Button
          size="lg"
          width="full"
          onClick={handleGoogleLogin}
          display="flex"
          alignItems="center"
          gap={2}
          bg="white"
          border="1px"
          borderColor="gray.200"
          _hover={{
            bg: 'gray.50',
          }}
        >
          {/* <GoogleIcon /> */}
          Sign in with Google
        </Button>
      </VStack>
    </Box>
  )
}
