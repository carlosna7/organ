// /lib/auth/index.ts
// Barrel export - facilita as importações

// Tokens
export {
  verifyToken,
  validateToken,
  getTokenExpiration,
  getTokenRemainingMinutes,
} from './tokens';
export type { AuthTokenPayload } from './tokens';

// Configurações
export {
  AUTH_COOKIE_CONFIG,
  PROTECTED_ROUTES,
  AUTH_ROUTES,
  API_CONFIG,
} from './config';

// Validações
export {
  isAuthenticated,
  getUserData,
  getCurrentToken,
  setAuthCookie,
  clearAuthCookie,
  isValidEmail,
  MIN_PASSWORD_LENGTH,
} from './validation';
export type { AuthUser } from './validation';
