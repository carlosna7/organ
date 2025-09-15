/**
 * Configurações padrão para cookies de autenticação
 */
export const AUTH_COOKIE_CONFIG = {
  name: 'organ-auth-token',
  maxAge: 30 * 60, // 30 minutos em segundos
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
export const AUTH_ROUTES = ['/login', '/register'] as const;

/**
 * URLs da API
 */
export const API_CONFIG = {
  graphqlEndpoint: 'http://localhost:4000',
} as const;