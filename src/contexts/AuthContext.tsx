import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthState {
  isLoggedIn: boolean;
  email: string;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  isLoggedIn: false,
  email: '',
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');

  const login = (email: string) => {
    setIsLoggedIn(true);
    setEmail(email);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setEmail('');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
