'use client'

import Link from 'next/link';
import React, { useContext, useState } from 'react';
import { gql } from "@apollo/client";
import AuthContext from '@/components/tokenContext';

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
		_id
		employeeId
		name
		position
		email
		company {
			_id
			companyId
			name
		}
    }
  }
`;

const login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const authContext = useContext(AuthContext)
	if (!authContext) {
		throw new Error("AuthContext must be used within an AuthProvider");
	}
	const { createCookie } = authContext;

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const userLogin = async () => {
			const response = await fetch('http://localhost:4000', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					query: LOGIN.loc?.source.body,
					variables: {
						email,
						password
					}
				})
			});

			const data = await response.json();
			console.log(data)
			if (data.errors) {
				console.log(data.errors[0]);
				// Redirect para página 404
			} else {
				// console.log(data)
				createCookie();
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
						type='current-password'
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