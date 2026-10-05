# Organ

Frontend do Organ, um organizador de equipe e tarefas. O líder cria a empresa, convida a equipe pelo email e distribui tarefas com responsáveis e status. Os dados vêm da API GraphQL do projeto irmão `../organ-api`; este projeto não acessa o banco de dados.

## Tecnologias

- Next.js 14.2.35 (App Router), React 18 e TypeScript
- Tailwind CSS 3, com a fonte Inter via `next/font/google`
- `jose` para verificar o JWT no middleware (edge runtime)
- `react-icons` e `server-only`
- ESLint com `next/core-web-vitals`

## Pré-requisitos

- Node.js 20 ou superior
- A API `organ-api` rodando, e portanto um MongoDB (local ou Atlas). Veja o [README da API](../organ-api/README.md).
- Acesso à internet no `npm run build`, porque o `next/font/google` baixa a fonte Inter nesse momento.

## Como rodar

```bash
npm install
cp .env.example .env.local     # no PowerShell: Copy-Item .env.example .env.local
# edite o .env.local e preencha JWT_SECRET (veja a tabela abaixo)
npm run dev
```

O app abre em `http://localhost:3000`. Para fazer login, a API precisa estar no ar (veja [Como rodar junto com a API](#como-rodar-junto-com-a-api)).

### Scripts

| Script | Comando | O que faz |
| --- | --- | --- |
| `npm run dev` | `next dev` | Servidor de desenvolvimento. Exige `JWT_SECRET`. |
| `npm run build` | `next build` | Build de produção. Não exige `JWT_SECRET`. |
| `npm start` | `next start` | Serve o build de produção. Exige `JWT_SECRET`. |
| `npm run lint` | `next lint` | Executa o ESLint. |

## Variáveis de ambiente

Copie `.env.example` para `.env.local` (o `.env.local` está no `.gitignore`; não o versione). Depois de alterar o arquivo, reinicie o servidor.

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `GRAPHQL_URL` | não | `http://localhost:4000` | URL da API GraphQL. Usada só no servidor do Next.js, nunca vai para o navegador. |
| `JWT_SECRET` | sim, para `next dev` e `next start` | - | Segredo para verificar o JWT. Deve ser **igual** ao `JWT_SECRET` da API, que assina o token. |
| `APP_TIME_ZONE` | não | `America/Sao_Paulo` | Fuso horário (IANA) usado para exibir as datas das tarefas, independente do fuso do servidor. |

Sobre o `JWT_SECRET`:

- O `next.config.mjs` interrompe `next dev` e `next start` com o erro "JWT_SECRET não definido" se a variável estiver ausente ou em branco.
- O `next build` não exige a variável. O segredo só é lido em tempo de execução, quando um token é verificado.
- Se o valor for diferente do da API, o login parece funcionar, mas o middleware rejeita o token em seguida e você volta para `/login` com a mensagem "Sua sessão expirou".

Sobre as variáveis da API:

- `JWT_EXPIRES_IN` e `CORS_ORIGIN` pertencem à API e não são lidas aqui. O cookie de sessão tem validade fixa de 8 horas (`maxAge` em `src/lib/auth/config.ts`). Um `JWT_EXPIRES_IN` menor que `8h` encurta a sessão; um maior não vai além das 8 horas do cookie.
- Como todas as chamadas à API partem do servidor do Next.js, o `CORS_ORIGIN` da API não afeta este app.

## Fluxo de uso

1. **Criar a empresa** em `/create-company`: nome da empresa e os dados do líder (nome, cargo, email e senha com no mínimo 6 caracteres). O nome da empresa é único ignorando maiúsculas e o email é único no sistema. Quem cria a empresa vira o **líder** e já entra no painel.
2. **Entrar no dashboard** em `/dashboard`. Em telas largas, a equipe (membros e convites pendentes) fica à esquerda e as tarefas à direita, com filtro por status (Todas, Pendente, Em andamento, Concluída).
3. **Convidar por email** (só o líder): no campo "Convidar por email". O convite apenas **registra o email no sistema**. **Nenhum email é enviado**: avise a pessoa por conta própria. O email aparece em "Convites pendentes" como "Aguardando cadastro".
4. **O convidado se cadastra** em `/register` (link "Fui convidado" na tela de login), informando nome, cargo, **o mesmo email do convite** e uma senha. Ele entra como **membro**, direto no painel. Email que ninguém convidou é recusado.
5. **Tarefas com responsáveis.** Qualquer pessoa da empresa cria tarefas em "Nova tarefa": nome, descrição opcional e responsáveis, cada um com um nível:
   - nível 3: Principal
   - nível 2: Apoio
   - nível 1: Acompanha

   Se nenhum responsável for marcado, quem criou a tarefa entra como responsável principal (nível 3). Só funcionários já cadastrados aparecem na lista de responsáveis.
6. **Status.** Cada tarefa tem o status Pendente, Em andamento ou Concluída, alterado pelo seletor e pelo botão "Atualizar". A data "Concluída em" aparece quando a tarefa é concluída.
7. **Gerenciar** (só o líder): editar nome, descrição e responsáveis de uma tarefa (ao menos um responsável), excluir tarefas, remover membros e cancelar convites. Ações destrutivas pedem uma segunda confirmação.
8. **Logout** pelo botão "Sair" no cabeçalho do painel.

## Papéis e permissões

A tela mostra apenas os controles a que o usuário tem direito, e a API aplica as mesmas regras.

| Ação | Líder | Membro |
| --- | --- | --- |
| Ver a equipe, os convites pendentes e todas as tarefas da empresa | sim | sim |
| Criar tarefa | sim | sim |
| Mudar o status de uma tarefa | de qualquer tarefa | só das tarefas em que é responsável |
| Editar tarefa (nome, descrição, responsáveis) | sim | não |
| Excluir tarefa | sim | não |
| Convidar por email | sim | não |
| Remover membro ou cancelar convite | sim, exceto a si mesmo | não |

O líder é sempre quem criou a empresa. Não há como trocar de papel nem transferir a liderança. Um membro que cria uma tarefa e não se inclui nos responsáveis não poderá mudar o status dela depois.

Quando o líder remove alguém, essa pessoa sai das tarefas em que era responsável e a sessão dela deixa de valer na próxima requisição (ela volta para `/login`).

## Rotas

| Rota | Grupo | Acesso | Descrição |
| --- | --- | --- | --- |
| `/` | `(main)` | pública | Página inicial. |
| `/login` | `(pages)` | só deslogado | Entrar. |
| `/register` | `(pages)` | só deslogado | Cadastro de quem foi convidado. |
| `/create-company` | `(pages)` | só deslogado | Criar empresa e conta de líder. |
| `/logout` | `(pages)` | pública | Apaga o cookie e redireciona para `/login?error=session_expired`. Usada quando a API rejeita a sessão. |
| `/dashboard` | `(dashboard)` | autenticado | Painel de equipe e tarefas. Aceita `?status=pendente`, `em_andamento` ou `concluida`. |

Os grupos entre parênteses organizam as pastas e não aparecem na URL.

## Estrutura de pastas

```
organ/
├── .env.example               # modelo das variáveis de ambiente
├── next.config.mjs            # exige JWT_SECRET ao subir next dev / next start
├── tailwind.config.ts         # cores da marca e dos status das tarefas
└── src/
    ├── middleware.ts          # protege /dashboard e verifica o JWT com jose
    ├── actions/               # Server Actions
    │   ├── auth.ts            #   logout
    │   ├── team.ts            #   convidar e remover funcionário
    │   ├── tasks.ts           #   criar, editar, mudar status e excluir tarefa
    │   ├── helpers.ts         #   tratamento de erros da API e leitura dos formulários
    │   └── types.ts           #   tipo do estado devolvido às actions
    ├── app/
    │   ├── layout.tsx         # layout raiz (fonte, metadados, lang pt-BR)
    │   ├── globals.css, icon.svg, error.tsx, not-found.tsx
    │   ├── (main)/            # página inicial (/)
    │   ├── (pages)/           # login, register, create-company e logout (route handler)
    │   └── (dashboard)/       # dashboard (/dashboard)
    ├── components/
    │   ├── ui/                # Alert, AuthLayout, Avatar, Badge, Button, Card, Input, Logo, SubmitButton
    │   ├── dashboard/         # seções de equipe e tarefas, formulários e cabeçalho do painel
    │   └── main/              # cabeçalho, rodapé e mockup da página inicial
    ├── lib/
    │   ├── auth/              # config (cookie, rotas, URL da API, fuso), tokens (jose), validation (cookie e usuário)
    │   ├── graphql.ts         # cliente GraphQL (somente servidor)
    │   ├── types.ts           # tipos do contrato da API e rótulos de status, papéis e níveis
    │   └── errors.ts          # mensagens de erro a partir do ?error= da URL
    └── types/                 # tipos de useFormState/useFormStatus (React canary)
```

Observações:

- `login`, `register` e `create-company` têm suas Server Actions dentro do próprio `page.tsx`. Em caso de erro, redirecionam para a mesma página com `?error=<código>`, e a página traduz o código em mensagem.
- As ações do painel (`src/actions`) devolvem `{ error }` ou `{ ok }` para os formulários (`useFormState`) e chamam `revalidatePath('/dashboard')` depois de cada alteração.
- `/dashboard` é renderizado a cada requisição (`force-dynamic`) com uma única query GraphQL (`me`, `getCompany`, `getEmployees` e `getTasks`).

## Autenticação

A API devolve um JWT (HS256) em `login`, `register` e `createCompany`. O front cuida dele assim:

- **Cookie httpOnly.** O token é gravado no cookie `organ-auth-token` por uma Server Action, com `httpOnly`, `sameSite: strict`, `path: /` e validade de 8 horas. Em produção (`NODE_ENV=production`, ou seja, `next start`) o cookie também é `secure`: sirva o app por HTTPS, senão o navegador pode não guardar o cookie. O JavaScript do navegador não consegue ler o token.
- **Chamadas à API só no servidor.** `src/lib/graphql.ts` é marcado com `server-only`. Ele lê o cookie e envia `Authorization: Bearer <token>` à API em cada requisição. Respostas com erro viram `{ data, error }`, com o código do primeiro erro GraphQL, e uma falha de conexão vira `NETWORK_ERROR`.
- **Middleware.** `src/middleware.ts` roda em quase todas as rotas (exceto `api`, `_next/static`, `_next/image` e `favicon.ico`) e verifica o cookie com `jose` (`jwtVerify`, algoritmo HS256, usando `JWT_SECRET`). Além da assinatura e da expiração, confere o formato do payload (`sub`, `company`, `role`, `employeeId`).
  - Rota protegida (`/dashboard`) sem token válido: redireciona para `/login`. Se havia um token inválido ou vencido, apaga o cookie e abre o login com "Sua sessão expirou".
  - Usuário autenticado em `/login`, `/register` ou `/create-company`: redireciona para `/dashboard`.
  - Token inválido em uma dessas rotas de autenticação: apenas apaga o cookie.
- **Sessão rejeitada pela API.** O middleware só confere o JWT, não consulta a API. Se a API responder `UNAUTHENTICATED` (por exemplo, funcionário removido), o dashboard redireciona para `/logout`, as Server Actions apagam o cookie e redirecionam para `/login`, ambos com a mensagem de sessão expirada.
- **Logout.** O botão "Sair" chama a Server Action `logoutAction`, que apaga o cookie e redireciona para `/login`. A API não tem logout: o token em si continua válido até expirar, mas o navegador o perdeu.

## Como rodar junto com a API

1. Suba o MongoDB (local ou Atlas) e configure a API em `../organ-api`, conforme o [README da API](../organ-api/README.md). Defina o `.env` dela com `MONGO_DB` e um `JWT_SECRET`.
2. Inicie a API:

   ```bash
   cd ../organ-api
   npm install
   npm run dev          # http://localhost:4000
   ```

3. Neste projeto, copie `.env.example` para `.env.local` e use **o mesmo valor de `JWT_SECRET`** da API. O `GRAPHQL_URL` padrão (`http://localhost:4000`) já aponta para a API local; mude-o se a porta for outra (`PORT` na API).
4. Inicie o front em outro terminal:

   ```bash
   npm install
   npm run dev          # http://localhost:3000
   ```

5. Abra `http://localhost:3000` e crie a empresa.

Problemas comuns:

| Sintoma | Causa provável |
| --- | --- |
| `next dev` ou `next start` não sobe, com "JWT_SECRET não definido" | `JWT_SECRET` ausente ou vazio no `.env.local`. |
| "Não foi possível conectar ao servidor" | A API não está rodando, ou o `GRAPHQL_URL` está errado. |
| O login funciona, mas volta para `/login` com "Sua sessão expirou" | O `JWT_SECRET` do front é diferente do da API. |
| "Este email não foi convidado por nenhuma empresa" em `/register` | O líder ainda não convidou esse email. Confira se é exatamente o mesmo. |
