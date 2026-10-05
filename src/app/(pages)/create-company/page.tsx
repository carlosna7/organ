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
	title: 'Criar empresa',
	description: 'Cadastre sua empresa no Organ e convide a equipe para organizar as tarefas.',
};

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
		<AuthLayout
			title="Criar sua empresa"
			description="Cadastre a empresa e a sua conta de líder. Depois é só convidar a equipe."
			footer={
				<div className="flex flex-col gap-2">
					<p>
						Já tem conta?{' '}
						<Link href="/login" className={textLinkStyles}>
							Entrar
						</Link>
					</p>
					<p>
						Sua empresa já usa o Organ?{' '}
						<Link href="/register" className={textLinkStyles}>
							Fui convidado
						</Link>
					</p>
				</div>
			}
		>
			<form action={handleSubmit} className="flex flex-col gap-5">
				{error && <Alert>{getErrorMessage(ERROR_MESSAGES, error)}</Alert>}

				<Input
					id="company"
					name="company"
					type="text"
					label="Nome da empresa"
					autoComplete="organization"
					required
				/>

				<fieldset className="flex flex-col gap-5 rounded-xl border border-slate-200 p-4">
					<legend className="px-1 text-sm font-semibold text-slate-900">Seus dados de líder</legend>

					<div className="grid gap-5 sm:grid-cols-2">
						<Input id="name" name="name" type="text" label="Nome" autoComplete="name" required />
						<Input id="position" name="position" type="text" label="Cargo" autoComplete="organization-title" required />
					</div>

					<Input id="email" name="email" type="email" label="Email" autoComplete="email" required />

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
				</fieldset>

				<SubmitButton size="lg" fullWidth pendingText="Criando empresa...">
					Criar empresa
				</SubmitButton>
			</form>
		</AuthLayout>
	);
}
