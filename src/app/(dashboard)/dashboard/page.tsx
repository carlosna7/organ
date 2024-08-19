'use client'

import React from 'react'
import { FaBars, FaUser } from "react-icons/fa6";

const dashboard = () => {

  return (
    <main className='flex h-screen w-screen bg-gray-200'>
      <nav className='flex flex-col gap-28 bg-white h-full w-52 p-4'>
        <button className='text-4xl font-bold'>LOGO</button>
        <ul className='flex flex-col gap-8'>
          <li className='flex items-center gap-4 text-3xl'><FaBars /><p className='text-lg'>teste</p></li>
          <li className='flex items-center gap-4 text-3xl'><FaBars /><p className='text-lg'>teste</p></li>
          <li className='flex items-center gap-4 text-3xl'><FaBars /><p className='text-lg'>teste</p></li>
          <li className='flex items-center gap-4 text-3xl'><FaBars /><p className='text-lg'>teste</p></li>
          <li className='flex items-center gap-4 text-3xl'><FaBars /><p className='text-lg'>teste</p></li>
          <li className='flex items-center gap-4 text-3xl'><FaBars /><p className='text-lg'>teste</p></li>
          <li className='flex items-center gap-4 text-3xl'><FaBars /><p className='text-lg'>teste</p></li>
          <li className='flex items-center gap-4 text-3xl'><FaBars /><p className='text-lg'>teste</p></li>
          <li className='flex items-center gap-4 text-3xl'><FaBars /><p className='text-lg'>teste</p></li>
        </ul>
      </nav>

      <div className='flex flex-col h-full w-full px-8 pb-16'>
        <header className='flex items-center justify-between h-40'>
          <h1 className='text-4xl font-bold'>Company Name</h1>
          <ul className='flex gap-6'>
            <li className='text-3xl'><FaUser /></li>
            <li className='text-3xl'><FaUser /></li>
            <li className='text-3xl'><FaUser /></li>
          </ul>
        </header>
        <section className='bg-white h-full w-full rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4'>
          <div className='flex flex-col bg-gray-200 h-[300px] w-full p-4 rounded-lg'>
            <p className='font-semibold'>Projeto 001</p>
            <p>Tasks 3/10</p>
            <p>Completas 3</p>
            <p>Em Andamento 4</p>
            <p>Incompletas 5</p>
          </div>
          <div className='flex flex-col bg-gray-200 h-[300px] w-full p-4 rounded-lg'>
            <p className='font-semibold'>Projeto 002</p>
            <p>Tasks 7/12</p>
            <p>Completas 5</p>
            <p>Em Andamento 2</p>
            <p>Incompletas 5</p>
          </div>
          <div className='flex flex-col bg-gray-200 h-[300px] w-full p-4 rounded-lg'>
            <p className='font-semibold'>Projeto 003</p>
            <p>Tasks 4/8</p>
            <p>Completas 2</p>
            <p>Em Andamento 2</p>
            <p>Incompletas 4</p>
          </div>
          <div className='flex flex-col bg-gray-200 h-[300px] w-full p-4 rounded-lg'>
            <p className='font-semibold'>Projeto 004</p>
            <p>Tasks 6/15</p>
            <p>Completas 6</p>
            <p>Em Andamento 4</p>
            <p>Incompletas 5</p>
          </div>
          <div className='flex flex-col bg-gray-200 h-[300px] w-full p-4 rounded-lg'>
            <p className='font-semibold'>Projeto 004</p>
            <p>Tasks 6/15</p>
            <p>Completas 6</p>
            <p>Em Andamento 4</p>
            <p>Incompletas 5</p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default dashboard


