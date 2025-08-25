'use client'

import React, { useContext, useState } from 'react';
import { gql } from "@apollo/client";
import AuthContext from '@/components/tokenContext';

const CREATE_COMPANY = gql`
  mutation CreateCompany($name: String!, $employee: EmployeeInput) {
    createCompany(name: $name, employee: $employee) {
      _id
      companyId
      name
      createdAt
      employees {
        _id
        name
        position
        email
      }
    }
  }
`;

const createCompany = () => {
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const firstAccessContext = useContext(AuthContext);
  if (!firstAccessContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }
  const { createCookie } = firstAccessContext;

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();

    const obj = {
      name: company,
      employee: {
        name: name,
        position: position,
        email: email,
        password: password
      }
    };

    const createMyCompany = async () => {
      const response = await fetch('http://localhost:4000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: CREATE_COMPANY.loc?.source.body,
          variables: obj
        })
      });
      const data = await response.json();
      if (data.errors) {
        console.log(data.errors[0]);
        // Redirect para página 404
      } else {
        console.log(data.data);
        createCookie();
      }
    };

    createMyCompany();
  }

  return (
    <main className='flex h-screen w-screen'>
      <div className='flex justify-center items-center bg-gray-200 w-1/2'>
        <p className='font-extrabold text-7xl'>IMAGEM</p>
      </div>

      <div className='flex justify-center items-center bg-blue-300 w-1/2'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
          <label>Empresa</label>
          <input
            type="name"
            placeholder='insira sua empresa...'
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <label>Nome</label>
          <input
            type="name"
            placeholder='insira seu nome...'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label>Cargo</label>
          <input
            type="position"
            placeholder='insira seu cargo...'
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <label>Email</label>
          <input
            type="email"
            placeholder='insira seu email...'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label>Senha</label>
          <input
            type="pass"
            placeholder='insira sua senha...'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Enviar</button>
        </form>
      </div>
    </main>
  )
}

export default createCompany