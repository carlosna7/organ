'use client'

import Link from 'next/link';
import React, { useState } from 'react';
import { gql } from "@apollo/client";
import { useRouter } from 'next/navigation';

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      _id
      employeeId
      name
      position
      token
    }
  }
`;

const login = () => {
  const [email , setEmail] = useState('');
  const [password , setPassword] = useState('');
  const route = useRouter()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const obj = {
      email,
      password
    };

    // setEmail('');
    // setPassword('');

    const userLogin = async () => {
      const response = await fetch('http://localhost:4000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: LOGIN.loc?.source.body,
          variables: obj
        })
      });
      const data = await response.json();
      if (data.errors) {
        console.log(data.errors[0].message);
      } else {
        console.log(data.data);
        localStorage.setItem('organ-token', data.data.login.token);
        route.push('/dashboard');
      }
    };
    userLogin();
  };

  return (
    <main className='flex h-screen w-screen'>
      <div className='flex justify-center items-center bg-gray-200 w-1/2'>
        <p className='font-extrabold text-7xl'>IMAGEM</p>
      </div>

      <div className='flex justify-center items-center bg-blue-300 w-1/2'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
          <label>email</label>
          <input
            type='email'
            value={email}
            placeholder='Digite seu email'
            onChange={(e) => setEmail(e.target.value)}
          />
          <label>senha</label>
          <input
            type='pass'
            value={password}
            placeholder='Digite sua senha'
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Enviar</button>
          <Link href="/register">Cadastrar-se</Link>
        </form>
      </div>
    </main>
  )
}

export default login