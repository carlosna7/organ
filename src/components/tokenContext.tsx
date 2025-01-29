'use client'

import React, { createContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

type AuthContextType = {
  loginToken: (newToken: string) => void;
  logoutToken: () => void;
  token: tokenI | null;
};

interface tokenI {
  eId: number;
  cId: string;
  exp: number;
  iat: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: any) => {

  const [token, setToken] = useState<tokenI | null>(null); 
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkCookie()
  }, [])

  useEffect(() => {
    if(pathname !== '/dashboard' && token) {
      logoutToken()
    }
  }, [pathname]);

  const checkCookie = () => {
    console.log('checkCookie');
    const cookie = document.cookie.split('; ').find((row) => row.startsWith('organ-auth-token='));
    if(cookie) {
      // verificar se o token é valido atravez de um middleware
      const tokenValue = cookie.split('=')[1];
      try {
        const decodedToken = jwtDecode<tokenI>(tokenValue);
        setToken(decodedToken);
        console.log('Token verificado e decodificado');
      } catch (error) {
        console.error('Erro ao decodificar o token:', error);
        logoutToken();
      }
    } else {
      logoutToken()
      console.log('Nenhum token encontrado');
    }
  };

  const loginToken = async (newToken: string) => {
    console.log('login');
    if(newToken) {
      const decodedToken = jwtDecode<tokenI>(newToken)
      setToken(decodedToken)

      if(decodedToken) {
        const expirationDate = new Date(decodedToken.exp * 1000);
        document.cookie = `organ-auth-token=${newToken}; expires=${expirationDate.toUTCString()}; path=/`;
        router.push('/dashboard');
      }
    }
  };

  const logoutToken = () => {
    console.log('logout');
    document.cookie = 'organ-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setToken(null);
    router.push('/login');
  };
  
  return (
    <AuthContext.Provider value={{ loginToken, logoutToken, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
