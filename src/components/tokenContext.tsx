'use client'

import React, { createContext } from 'react';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }: any) => {

  // console.log("AuthProvider")

  function getCookie(name: string): string | undefined {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookie = parts.pop()?.split(';').shift();
      return cookie;
    }
  }
  const token = getCookie('organ-token');
  // const decoded = jwtDecode(token);
  // console.log(token)
  
  return (
    <AuthContext.Provider value={null}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
