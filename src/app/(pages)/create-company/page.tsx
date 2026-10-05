import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isValidEmail, MIN_PASSWORD_LENGTH, setAuthCookie } from '@/lib/auth';
import { graphqlRequest } from '@/lib/graphql';
import type { AuthPayload } from '@/lib/types';

const CREATE_COMPANY_MUTATION = `
	mutation CreateCompany($name: String!, $employee: EmployeeInput!) {
		createCompany(name: $name, employee: $employee) {
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
	company_exists: 'Já existe uma empresa com esse nome.',
	email_exists: 'Este email já está cadastrado.',
	invalid_data: 'Dados inválidos. Verifique os campos.',
	network_error: 'Não foi possível conectar ao servidor. Tente novamente.',
	server_error: 'Erro inesperado. Tente novamente.',
};

// Server Action para criar a empresa e o líder
async function handleSubmit(formData: FormData) {
	'use server';

	const company = String(formData.get('company') ?? '').trim();
	const name = String(formData.get('name') ?? '').trim();
	const position = String(formData.get('position') ?? '').trim();
	const email = String(formData.get('email') ?? '').trim().toLowerCase();
	const password = String(formData.get('password') ?? '');

	// Verifica os campos antes de chamar a API
	if (!company || !name || !position || !email || !password) redirect('/create-company?error=missing_fields');
	if (!isValidEmail(email)) redirect('/create-company?error=invalid_email');
	if (password.length < MIN_PASSWORD_LENGTH) redirect('/create-company?error=weak_password');

	const { data, error } = await graphqlRequest<{ createCompany: AuthPayload }>(
		CREATE_COMPANY_MUTATION,
		{ name: company, employee: { name, position, email, password } },
		{ auth: false }
	);

	// redirect() lança exceção, por isso fica fora de try/catch
	if (error) {
		if (error.code === 'NETWORK_ERROR') redirect('/create-company?error=network_error');
		if (error.code === 'CONFLICT') {
			// A API usa CONFLICT para empresa ou email já existentes; diferencia pela mensagem
			const isCompanyConflict = /empresa/i.test(error.message);
			redirect(`/create-company?error=${isCompanyConflict ? 'company_exists' : 'email_exists'}`);
		}
		if (error.code === 'BAD_USER_INPUT') redirect('/create-company?error=invalid_data');
		console.error('Create company error:', error);
		redirect('/create-company?error=server_error');
	}

	// Grava o JWT da API no cookie httpOnly
	await setAuthCookie(data.createCompany.token);

	redirect('/dashboard');
}

// Componente da página (Server Component)
export default function CreateCompany({ searchParams }: { searchParams: { error?: string } }) {
	const error = searchParams?.error;

	return (
		<main className='flex h-screen w-screen'>
			<div className='flex justify-center items-center bg-gray-200 w-1/2'>
				<p className='font-extrabold text-7xl'>IMAGEM</p>
			</div>

			<div className='flex justify-center items-center bg-blue-300 w-1/2'>
				<form action={handleSubmit} className='flex flex-col gap-2'>
					{error && (
						<div className='text-red-600 mb-2'>
							{ERROR_MESSAGES[error] ?? ERROR_MESSAGES.server_error}
						</div>
					)}

					<label htmlFor="company">Empresa</label>
					<input
						id="company"
						name="company"
						type="text"
						placeholder='insira sua empresa...'
						autoComplete="organization"
						required
					/>
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
						placeholder='insira seu email...'
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
		</main>
	);
}
