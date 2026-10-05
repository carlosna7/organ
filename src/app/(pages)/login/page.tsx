import Link from 'next/link';
import { redirect } from 'next/navigation';
import { setAuthCookie } from '@/lib/auth';
import { graphqlRequest } from '@/lib/graphql';
import type { AuthPayload } from '@/lib/types';

const LOGIN_MUTATION = `
	mutation Login($email: String!, $password: String!) {
		login(email: $email, password: $password) {
			token
			employee {
				_id
				employeeId
				name
			}
		}
	}
`;

// Mensagens exibidas conforme o código em ?error=
const ERROR_MESSAGES: Record<string, string> = {
	missing_fields: 'Por favor, preencha todos os campos.',
	invalid_credentials: 'Email ou senha inválidos.',
	network_error: 'Não foi possível conectar ao servidor. Tente novamente.',
	session_expired: 'Sua sessão expirou. Faça login novamente.',
	server_error: 'Erro inesperado. Tente novamente.',
};

// Server Action para lidar com o login
async function loginAction(formData: FormData) {
	'use server';

	const email = String(formData.get('email') ?? '').trim().toLowerCase();
	const password = String(formData.get('password') ?? '');

	if (!email || !password) {
		redirect('/login?error=missing_fields');
	}

	const { data, error } = await graphqlRequest<{ login: AuthPayload }>(
		LOGIN_MUTATION,
		{ email, password },
		{ auth: false }
	);

	// redirect() lança exceção, por isso fica fora de try/catch
	if (error) {
		if (error.code === 'NETWORK_ERROR') redirect('/login?error=network_error');
		if (error.code === 'BAD_USER_INPUT') redirect('/login?error=invalid_credentials');
		console.error('Login error:', error);
		redirect('/login?error=server_error');
	}

	// Grava o JWT da API no cookie httpOnly
	await setAuthCookie(data.login.token);

	redirect('/dashboard');
}

// Componente da página (Server Component)
export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
	const error = searchParams?.error;

	return (
		<main className='flex h-screen w-screen'>
			<div className='flex justify-center items-center bg-gray-200 w-1/2'>
				<p className='font-extrabold text-7xl'>IMAGEM</p>
			</div>

			<div className='flex justify-center items-center bg-blue-300 w-1/2'>
				<form action={loginAction} className='flex flex-col gap-2'>
					{error && (
						<div className='text-red-600 mb-2'>
							{ERROR_MESSAGES[error] ?? ERROR_MESSAGES.server_error}
						</div>
					)}

					<label htmlFor="email">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						placeholder="Digite seu email"
						autoComplete="email"
						required
					/>

					<label htmlFor="password">Senha</label>
					<input
						id="password"
						name="password"
						type="password"
						placeholder="Digite sua senha"
						autoComplete="current-password"
						required
					/>

					<button type="submit">Enviar</button>
					<Link href="/register">Cadastrar-se</Link>
					<Link href="/create-company">Cadastrar empresa</Link>
				</form>
			</div>
		</main>
	);
}
