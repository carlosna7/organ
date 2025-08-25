'use client'

import React, { createContext, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type AuthContextType = {
	createCookie: () => void;
	logoutCookie: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: any) => {

	const pathname = usePathname();
	const router = useRouter();

	const checkCookie = () => {
		const cookie = document.cookie.split('; ').find((row) => row.startsWith('organ-auth-token='));
		
		if (pathname === '/dashboard') {
			if(cookie) {
				// verificar se o cookie não expirou
				const token = cookie.split('=')[1];
				const parts: string[] = token.split("-");
				const timestampString: string | undefined = parts.pop();

				if (!timestampString) return;

				const timestamp: number = parseInt(timestampString, 10);
				const now: number = Date.now();


				if (now > timestamp) {
					logoutCookie();
				}
			}
		}
		
	};

	const generateCode = async (): Promise<string> => {
		const part1 = Math.floor(Math.random() * 9000 + 50000);
		const part2 = Math.floor(Math.random() * 90000 + 7000000);
		const part3 = Math.floor(Math.random() * 900 + 300);
		const dateDow = Date.now() + 30 * 60 * 1000;

		return `${part1}-${part2}-${part3}-${dateDow}`;
	}

	const createCookie = async (): Promise<void> => {
		const newToken: string = await generateCode();
		if (newToken) {
			const parts: string[] = newToken.split("-");
			const timestampString: string | undefined = parts.pop();

			if (!timestampString) {
				console.error("Erro: timestamp não encontrado no token.");
				return;
			}

			const timestamp: number = parseInt(timestampString, 10);
			if (isNaN(timestamp)) {
				console.error("Erro: timestamp inválido.");
				return;
			}

			// Adiciona 30 minutos (em ms)
			const expirationDate: Date = new Date(timestamp + 30 * 60 * 1000);

			document.cookie = `organ-auth-token=${newToken}; expires=${expirationDate.toUTCString()}; path=/`;

			router.push('/dashboard');
		}
	};

	const logoutCookie = async (): Promise<void> => {
		
		document.cookie = 'organ-auth-token=; path=/;';
		router.push('/login');
	};

	useEffect(() => {
		if (pathname !== '/dashboard') {
			document.cookie = 'organ-auth-token=; path=/;';
		}
		checkCookie()

	}, [pathname]);

	return (
		<AuthContext.Provider value={{ createCookie, logoutCookie }}>
			{children}
		</AuthContext.Provider>
	);
};

export default AuthContext;
