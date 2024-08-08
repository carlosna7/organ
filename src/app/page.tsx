'use client'

import Link from 'next/link';
import React, { useEffect } from 'react'

import { gql } from "@apollo/client";

const Home = () => {

  const query = gql`
    query GetCompanies {
      getCompanies {
        _id
        companyId
        name
        employees {
          employeeId
          name
          position
          email
          password
        }
      }
    }
  `;
  
  useEffect(() => {
    const fetchData = async () => {

      const response = await fetch('http://localhost:4000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.loc?.source.body
        })
      });
      const data = await response.json();
      console.log(data);
    };
  
    fetchData();
  }, []);

  return (
    <>
      <header className='flex justify-between items-center px-40 py-4 bg-gray-400'>
        <p className='font-extrabold text-4xl'>LOGO</p>
        <nav className='flex gap-8'>
          <Link href='/pages/login'>Login</Link>
          <Link href='/pages/register'>Cadastre-se</Link>
        </nav>
      </header>

      <main className='flex h-screen w-screen px-40'>
        <div className='flex flex-col justify-center gap-4 bg-gray-200 w-2/5'>
          <p className='text-xl'>Plataforma para Gestão de Projetos Digitais</p>
          <p className='font-bold text-5xl'>Domine a Lucratividade de Seus Projetos e Aumente Seus Ganhos</p>
          <p className='font-medium text-2xl'>Descubra prejuízos com retrabalhos, controle as horas faturáveis e de custos dos seus serviços prestados.</p>
          <Link href="/pages/create" className='p-4 bg-green-400 rounded-lg font-bold text-center max-w-[300px]'>Cadastre sua empresa de graça!</Link>
        </div>
        <div className='flex justify-center w-3/5'>
          <p className='font-extrabold text-7xl'>IMAGEM DO DASHBOARD</p>
        </div>
      </main>
    </>
  )
}

export default Home;