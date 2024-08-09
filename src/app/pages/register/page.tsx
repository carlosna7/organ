'use client'

import Link from 'next/link';
import React, { useState } from 'react'
import { gql } from "@apollo/client";

const REGISTER = gql`
  mutation Register($name: String!, $position: String!, $email: String!, $password: String!) {
    register(name: $name, position: $position, email: $email, password: $password) {
      _id
      employeeId
      name
      position
      email
      password
      token
    }
  }
`;

const register = () => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();

    const obj = {
      name: name,
      position: position,
      email: email,
      password: password
    }

    // setName('');
    // setPosition('');
    // setEmail('');
    // setPassword('');

    const userRegister = async () => {
      const response = await fetch('http://localhost:4000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: REGISTER.loc?.source.body,
          variables: obj
        })
      });
      const data = await response.json();
    };
  
    userRegister();
  }

  return (
    <main className='flex h-screen w-screen'>
      <div className='flex justify-center items-center bg-blue-300 w-1/2'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
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
          <Link href="/pages/login">cadastre-se </Link>
        </form>
      </div>

      <div className='flex justify-center items-center bg-gray-200 w-1/2'>
        <p className='font-extrabold text-7xl'>IMAGEM</p>
      </div>
    </main>
  )
}

export default register