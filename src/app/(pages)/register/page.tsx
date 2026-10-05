import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isValidEmail, MIN_PASSWORD_LENGTH, setAuthCookie } from '@/lib/auth';
import { graphqlRequest } from '@/lib/graphql';
import type { AuthPayload } from '@/lib/types';

const REGISTER_MUTATION = `
	mutation Register($name: String!, $position: String!, $email: String!, $password: String!) {
		register(name: $name, position: $position, email: $email, password: $password) {
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
	invalid_email: 'Email inválido.',
	weak_password: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
	not_invited: 'Este email não foi convidado por nenhuma empresa.',
	already_registered: 'Este email já está cadastrado. Faça login.',
	invalid_data: 'Dados inválidos. Verifique os campos.',
	network_error: 'Não foi possível conectar ao servidor. Tente novamente.',
	server_error: 'Erro inesperado. Tente novamente.',
};

// Server Action para lidar com o cadastro de um funcionário convidado
async function handleSubmit(formData: FormData) {
	'use server';

	const name = String(formData.get('name') ?? '').trim();
	const position = String(formData.get('position') ?? '').trim();
	const email = String(formData.get('email') ?? '').trim().toLowerCase();
	const password = String(formData.get('password') ?? '');

	// Verifica os campos antes de chamar a API
	if (!name || !position || !email || !password) redirect('/register?error=missing_fields');
	if (!isValidEmail(email)) redirect('/register?error=invalid_email');
	if (password.length < MIN_PASSWORD_LENGTH) redirect('/register?error=weak_password');

	const { data, error } = await graphqlRequest<{ register: AuthPayload }>(
		REGISTER_MUTATION,
		{ name, position, email, password },
		{ auth: false }
	);

	// redirect() lança exceção, por isso fica fora de try/catch
	if (error) {
		if (error.code === 'NETWORK_ERROR') redirect('/register?error=network_error');
		if (error.code === 'NOT_FOUND') redirect('/register?error=not_invited');
		if (error.code === 'CONFLICT') redirect('/register?error=already_registered');
		if (error.code === 'BAD_USER_INPUT') redirect('/register?error=invalid_data');
		console.error('Register error:', error);
		redirect('/register?error=server_error');
	}

	// Grava o JWT da API no cookie httpOnly
	await setAuthCookie(data.register.token);

	redirect('/dashboard');
}

// Componente da página (Server Component)
export default function Register({ searchParams }: { searchParams: { error?: string } }) {
	const error = searchParams?.error;

	return (
		<main className='flex h-screen w-screen'>
			<div className='flex justify-center items-center bg-blue-300 w-1/2'>
				<form action={handleSubmit} className='flex flex-col gap-2'>
					{error && (
						<div className='text-red-600 mb-2'>
							{ERROR_MESSAGES[error] ?? ERROR_MESSAGES.server_error}
						</div>
					)}

					<label htmlFor="name">Nome</label>
					<input
						id="name"
						name="name"
						type="text"
						placeholder='insira seu nome...'
						autoComplete="name"
						required
					/>
					<label htmlFor="position">Cargo</label>
					<input
						id="position"
						name="position"
						type="text"
						placeholder='insira seu cargo...'
						required
					/>
					<label htmlFor="email">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						placeholder='insira o email convidado...'
						autoComplete="email"
						required
					/>
					<label htmlFor="password">Senha</label>
					<input
						id="password"
						name="password"
						type="password"
						placeholder='insira sua senha...'
						autoComplete="new-password"
						minLength={MIN_PASSWORD_LENGTH}
						required
					/>
					<button type="submit">Enviar</button>
					<Link href="/login">Já tenho conta</Link>
				</form>
			</div>

			<div className='flex justify-center items-center bg-gray-200 w-1/2'>
				<p className='font-extrabold text-7xl'>IMAGEM</p>
			</div>
		</main>
	);
}
