// Subpaths evitam importar o JWE (APIs não suportadas no edge)
import { jwtVerify } from 'jose/jwt/verify';
import { decodeJwt } from 'jose/jwt/decode';

/**
 * Dados gravados no JWT pela API
 */
export type AuthTokenPayload = {
  sub: string; // Employee._id
  company: string; // Company._id
  role: 'leader' | 'member';
  employeeId: number;
  name: string;
  email: string;
  exp?: number;
};

/**
 * Obtém a chave usada para verificar o JWT (HS256)
 * @returns Uint8Array | null - Chave ou null se JWT_SECRET não estiver definido
 */
function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET não definido: não é possível validar tokens.');
    return null;
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verifica a assinatura e a validade do token e devolve o payload
 * Funciona no middleware (edge) e no servidor
 * @param token - JWT recebido da API
 * @returns Promise<AuthTokenPayload | null> - Payload ou null se inválido/expirado
 */
export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  if (!token) return null;

  const secret = getJwtSecret();
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });

    // Verifica se o payload tem o formato do contrato
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.company !== 'string' ||
      (payload.role !== 'leader' && payload.role !== 'member') ||
      typeof payload.employeeId !== 'number'
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      company: payload.company,
      role: payload.role,
      employeeId: payload.employeeId,
      name: typeof payload.name === 'string' ? payload.name : '',
      email: typeof payload.email === 'string' ? payload.email : '',
      exp: payload.exp,
    };
  } catch {
    // Assinatura inválida, token malformado ou expirado
    return null;
  }
}

/**
 * Valida se um token está válido e não expirou
 * @param token - Token a ser validado
 * @returns Promise<boolean> - true se válido, false caso contrário
 */
export async function validateToken(token: string): Promise<boolean> {
  return (await verifyToken(token)) !== null;
}

/**
 * Extrai o timestamp de expiração do token (sem verificar a assinatura)
 * @param token - Token para extrair timestamp
 * @returns number | null - Timestamp de expiração em ms ou null se inválido
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const { exp } = decodeJwt(token);
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Calcula quantos minutos restam até o token expirar
 * @param token - Token para verificar
 * @returns number - Minutos restantes (negativo se já expirou)
 */
export function getTokenRemainingMinutes(token: string): number {
  const expiration = getTokenExpiration(token);
  if (!expiration) return -1;

  const remainingMs = expiration - Date.now();
  return Math.floor(remainingMs / (1000 * 60));
}
