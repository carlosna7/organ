/**
 * Configurações padrão para cookies de autenticação
 */
export const AUTH_COOKIE_CONFIG = {
  name: 'organ-auth-token',
  maxAge: 8 * 60 * 60, // 8 horas em segundos (mesma validade do JWT)
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
} as const;

/**
 * Lista de rotas que requerem autenticação
 */
export const PROTECTED_ROUTES = ['/dashboard'] as const;

/**
 * Lista de rotas de autenticação (login, register, etc.)
 */
export const AUTH_ROUTES = ['/login', '/register', '/create-company'] as const;

/**
 * URLs da API (usadas só no servidor)
 */
export const API_CONFIG = {
  graphqlEndpoint: process.env.GRAPHQL_URL || 'http://localhost:4000',
} as const;
