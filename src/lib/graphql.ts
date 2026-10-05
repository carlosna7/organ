import 'server-only';

import { API_CONFIG, getCurrentToken } from '@/lib/auth';

/**
 * Códigos de erro do contrato (+ NETWORK_ERROR para falha de conexão)
 */
export type GraphQLErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'BAD_USER_INPUT'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'NETWORK_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | (string & {});

export type GraphQLRequestError = {
  code: GraphQLErrorCode;
  message: string;
};

export type GraphQLResult<T> =
  | { data: T; error: null }
  | { data: null; error: GraphQLRequestError };

type GraphQLResponseBody<T> = {
  data?: T | null;
  errors?: { message?: string; extensions?: { code?: string } }[];
};

/**
 * Faz uma requisição à API GraphQL (somente no servidor)
 * @param query - Query ou mutation em string
 * @param variables - Variáveis da operação
 * @param options.auth - Envia o JWT do cookie no header Authorization (padrão: true)
 * @returns Promise<GraphQLResult<T>> - { data, error } com o código do primeiro erro
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  { auth = true }: { auth?: boolean } = {}
): Promise<GraphQLResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await getCurrentToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let body: GraphQLResponseBody<T>;

  try {
    const response = await fetch(API_CONFIG.graphqlEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    });

    body = await response.json();
  } catch (err) {
    // API fora do ar ou resposta que não é JSON
    console.error('Erro de conexão com a API GraphQL:', err);
    return {
      data: null,
      error: { code: 'NETWORK_ERROR', message: 'Não foi possível conectar ao servidor.' },
    };
  }

  // Verifica se a API devolveu erros
  if (body.errors?.length) {
    const [first] = body.errors;
    return {
      data: null,
      error: {
        code: first.extensions?.code || 'INTERNAL_SERVER_ERROR',
        message: first.message || 'Erro inesperado no servidor.',
      },
    };
  }

  if (!body.data) {
    return {
      data: null,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Resposta vazia do servidor.' },
    };
  }

  return { data: body.data, error: null };
}
