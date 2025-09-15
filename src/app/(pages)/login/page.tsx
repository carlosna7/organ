import Link from 'next/link';
import { redirect, RedirectType } from 'next/navigation';
import { cookies } from 'next/headers';
import { generateSecureToken, AUTH_COOKIE_CONFIG } from '@/lib/auth';

// Server Action para lidar com o login
async function loginAction(formData: FormData) {
	'use server';

	const email = formData.get('email') as string;
	const password = formData.get('password') as string;

	if (!email || !password) {
		redirect('/login?error=missing_fields');
	}

	const LOGIN_QUERY = `
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

	const response = await fetch('http://localhost:4000', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			query: LOGIN_QUERY,
			variables: { email, password }
		})
	});

	const data = await response.json();

	if (data.errors) {
		console.error('Login error:', data.errors[0]);
		redirect('/login?error=invalid_credentials');
	} else {
		// Criar token seguro
		const token = await generateSecureToken();

		// Definir cookie httpOnly e secure
		const cookieStore = cookies();
		const expirationDate = new Date(Date.now() + AUTH_COOKIE_CONFIG.maxAge * 1000); // 30 minutos

		cookieStore.set(AUTH_COOKIE_CONFIG.name, token, {
			httpOnly: AUTH_COOKIE_CONFIG.httpOnly,
			secure: AUTH_COOKIE_CONFIG.secure,
			sameSite: AUTH_COOKIE_CONFIG.sameSite,
			expires: expirationDate,
			path: AUTH_COOKIE_CONFIG.path
		});

		redirect('/dashboard', RedirectType.push);
	}
}

// Componente da página (Server Component)
export default function LoginPage({ searchParams }: { searchParams: { error?: string };}) {
	const error = searchParams?.error;

	return (
		<main className='flex h-screen w-screen'>
			<div className='flex justify-center items-center bg-gray-200 w-1/2'>
				<p className='font-extrabold text-7xl'>IMAGEM</p>
			</div>

			<div className='flex justify-center items-center bg-blue-300 w-1/2'>
				<form action={loginAction} className='flex flex-col gap-2'>
					{error && (
						<div className='text-red-500 mb-2'>
							{error === 'missing_fields' && 'Por favor, preencha todos os campos.'}
							{error === 'invalid_credentials' && 'Email ou senha inválidos.'}
							{error === 'network_error' && 'Erro de conexão. Tente novamente.'}
						</div>
					)}

					<label htmlFor="email">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						placeholder="Digite seu email"
						required
					/>

					<label htmlFor="password">Senha</label>
					<input
						id="password"
						name="password"
						type="password"
						placeholder="Digite sua senha"
						required
					/>

					<button type="submit">Enviar</button>
					<Link href="/register">Cadastrar-se</Link>
				</form>
			</div>
		</main>
	);
}