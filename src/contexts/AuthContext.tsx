import { createContext, useContext, useState, ReactNode } from 'react';
import { AuthState, UserRole } from '@/lib/types';

interface AuthContextType {
  auth: AuthState;
  login: (role: UserRole, playerId?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({ role: null, playerId: null });

  const login = (role: UserRole, playerId?: string) => {
    setAuth({ role, playerId: playerId || null });
  };

  const logout = () => {
    setAuth({ role: null, playerId: null });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
