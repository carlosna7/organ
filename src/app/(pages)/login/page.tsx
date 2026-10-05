import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { setAuthCookie } from '@/lib/auth';
import { graphqlRequest } from '@/lib/graphql';
import type { AuthPayload } from '@/lib/types';
import Alert from '@/components/ui/Alert';
import AuthLayout from '@/components/ui/AuthLayout';
import { textLinkStyles } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SubmitButton from '@/components/ui/SubmitButton';

export const metadata: Metadata = {
	title: 'Entrar',
	description: 'Acesse o painel da sua empresa no Organ.',
};

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
		<AuthLayout
			title="Entrar no Organ"
			description="Acesse o painel da sua empresa para ver a equipe e as tarefas."
			footer={
				<div className="flex flex-col gap-2">
					<p>
						Recebeu um convite da sua empresa?{' '}
						<Link href="/register" className={textLinkStyles}>
							Fui convidado
						</Link>
					</p>
					<p>
						Quer organizar a sua equipe?{' '}
						<Link href="/create-company" className={textLinkStyles}>
							Criar minha empresa
						</Link>
					</p>
				</div>
			}
		>
			<form action={loginAction} className="flex flex-col gap-5">
				{error && <Alert>{ERROR_MESSAGES[error] ?? ERROR_MESSAGES.server_error}</Alert>}

				<Input id="email" name="email" type="email" label="Email" autoComplete="email" required />

				<Input
					id="password"
					name="password"
					type="password"
					label="Senha"
					autoComplete="current-password"
					required
				/>

				<SubmitButton size="lg" fullWidth pendingText="Entrando...">
					Entrar
				</SubmitButton>
			</form>
		</AuthLayout>
	);
}
