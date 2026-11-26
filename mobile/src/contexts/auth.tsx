import { createContext, useContext, useState, type ReactNode } from 'react';
import { login, register, type RegisterData } from '@/services/api';

interface AuthContextValue {
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: RegisterData) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* Guarda o token JWT do pediatra logado.
   Por enquanto fica só na memória: ao fechar o app, é preciso logar de novo. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  async function signIn(email: string, password: string) {
    const { access_token } = await login(email, password);
    setToken(access_token);
  }

  /* Cadastra o pediatra e já deixa logado com o token devolvido */
  async function signUp(data: RegisterData) {
    const { access_token } = await register(data);
    setToken(access_token);
  }

  function signOut() {
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
