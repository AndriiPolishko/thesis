import { useToast } from '@chakra-ui/react'
import axios from 'axios'
import React, { useState, createContext, useContext, useEffect } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  login: () => void
  logout: () => void,
  loading: boolean,
  user: any
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const toast = useToast();
  const login = () => setIsAuthenticated(true)
  const logout = () => setIsAuthenticated(false)

  async function getUser() {
    axios.get('http://localhost:8001/auth/google/me', { withCredentials: true })
    .then((res) => {
      setIsAuthenticated(true);
      setUser(res.data);
    })
    .catch(() => {
      toast({
        title: "Failed to fetch user",
        description: "Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right"
      });

      setIsAuthenticated(false)})
    .finally(() => setLoading(false));
  }

  useEffect(() => {
    getUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated, loading, user,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
