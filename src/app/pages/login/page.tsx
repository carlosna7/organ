'use client'

import Link from 'next/link';
import React, { useState } from 'react';

const login = () => {

  const [email , setEmail] = useState('');
  const [password , setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const obj = {
      email,
      password
    };

    console.log(obj);

    // setEmail('')
    // setPassword('')
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
          <Link href="/pages/register">Cadastrar-se</Link>
        </form>
      </div>
    </main>
  )
}

export default login