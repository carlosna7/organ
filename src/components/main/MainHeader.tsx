import Link from 'next/link'
import React from 'react'

const MainHeader = () => {
  return (
    <header className='flex justify-between items-center px-40 py-4 bg-gray-400'>
      <p className='font-extrabold text-4xl'>LOGO</p>
      <nav className='flex gap-8'>
          <Link href='/login'>Login</Link>
          <Link href='/register'>Cadastre-se</Link>
      </nav>
    </header>
  )
}

export default MainHeader