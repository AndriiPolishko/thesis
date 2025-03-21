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
  
  // TODO: Implement login and logout functions
  const login = () => setIsAuthenticated(true)
  const logout = () => setIsAuthenticated(false)

  async function getUser() {
    axios.get('http://localhost:8001/auth/google/me', { withCredentials: true })
    .then((res) => {
      console.log(res.data);
      setIsAuthenticated(true);
      setUser(res.data);
    })
    .catch((error) => {
      console.log("error: ", error);
      setIsAuthenticated(false)})
    .finally(() => setLoading(false));
  }

  useEffect(() => {
    getUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // or a spinner
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
