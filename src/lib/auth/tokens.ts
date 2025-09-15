/**
 * Gera um token seguro para autenticação
 * @returns Promise<string> Token no formato: part1-part2-part3-timestamp
 */
export async function generateSecureToken(): Promise<string> {
  const part1 = Math.floor(Math.random() * 9000 + 50000);
  const part2 = Math.floor(Math.random() * 90000 + 7000000);
  const part3 = Math.floor(Math.random() * 900 + 300);
  const expirationTime = Date.now() + 30 * 60 * 1000; // 30 minutos

  return `${part1}-${part2}-${part3}-${expirationTime}`;
}

/**
 * Valida se um token está válido e não expirou
 * @param token - Token a ser validado
 * @returns boolean - true se válido, false caso contrário
 */
export function validateToken(token: string): boolean {
  try {
    if (!token) return false;
    
    const parts = token.split('-');
    const timestampString = parts.pop();
    
    if (!timestampString) return false;
    
    const timestamp = parseInt(timestampString, 10);
    if (isNaN(timestamp)) return false;
    
    const now = Date.now();
    return now < timestamp;
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return false;
  }
}

/**
 * Extrai o timestamp de expiração do token
 * @param token - Token para extrair timestamp
 * @returns number | null - Timestamp de expiração ou null se inválido
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const parts = token.split('-');
    const timestampString = parts.pop();
    
    if (!timestampString) return null;
    
    const timestamp = parseInt(timestampString, 10);
    return isNaN(timestamp) ? null : timestamp;
  } catch (error) {
    console.error('Erro ao extrair timestamp:', error);
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
  
  const now = Date.now();
  const remainingMs = expiration - now;
  return Math.floor(remainingMs / (1000 * 60));
}