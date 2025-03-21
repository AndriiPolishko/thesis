import { Box } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { LoginPage } from './components/Auth/LoginPage/LoginPage'
import { ProtectedRoute } from './components/Auth/ProtectedRoute/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { Navigation } from './components/Navigation/Navigation'
import { Header } from './components/Header/Header'

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Box w="100%" minH="100vh" bg="gray.50">
                  <Header />
                  <Box maxW="container.lg" mx="auto" py={8} px={4}>
                    <Navigation />
                  </Box>
                </Box>
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={<Navigate to="/campaigns/create" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
