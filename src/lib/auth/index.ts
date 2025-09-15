// /lib/auth/index.ts
// Barrel export - facilita as importações

// Tokens
export {
  generateSecureToken,
  validateToken,
  getTokenExpiration,
  getTokenRemainingMinutes,
} from './tokens';

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
} from './validation';