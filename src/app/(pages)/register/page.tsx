import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isValidEmail, MIN_PASSWORD_LENGTH, setAuthCookie } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { graphqlRequest } from '@/lib/graphql';
import type { AuthPayload } from '@/lib/types';
import Alert from '@/components/ui/Alert';
import AuthLayout from '@/components/ui/AuthLayout';
import { textLinkStyles } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SubmitButton from '@/components/ui/SubmitButton';

export const metadata: Metadata = {
	title: 'Criar conta',
	description: 'Recebeu um convite? Crie sua conta no Organ com o email convidado.',
};

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
		<AuthLayout
			title="Criar sua conta"
			description="Fui convidado: use o mesmo email que o líder da sua empresa cadastrou no convite."
			footer={
				<div className="flex flex-col gap-2">
					<p>
						Já tem conta?{' '}
						<Link href="/login" className={textLinkStyles}>
							Entrar
						</Link>
					</p>
					<p>
						Ainda não tem empresa no Organ?{' '}
						<Link href="/create-company" className={textLinkStyles}>
							Criar minha empresa
						</Link>
					</p>
				</div>
			}
		>
			<form action={handleSubmit} className="flex flex-col gap-5">
				{error && <Alert>{getErrorMessage(ERROR_MESSAGES, error)}</Alert>}

				<div className="grid gap-5 sm:grid-cols-2">
					<Input id="name" name="name" type="text" label="Nome" autoComplete="name" required />
					<Input id="position" name="position" type="text" label="Cargo" autoComplete="organization-title" required />
				</div>

				<Input
					id="email"
					name="email"
					type="email"
					label="Email convidado"
					hint="O mesmo email que recebeu o convite."
					autoComplete="email"
					required
				/>

				<Input
					id="password"
					name="password"
					type="password"
					label="Senha"
					hint={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres.`}
					autoComplete="new-password"
					minLength={MIN_PASSWORD_LENGTH}
					required
				/>

				<SubmitButton size="lg" fullWidth pendingText="Criando conta...">
					Criar conta
				</SubmitButton>
			</form>
		</AuthLayout>
	);
}
