const GENERIC_ERROR_MESSAGE = 'Erro inesperado. Tente novamente.';

/**
 * Busca a mensagem de erro de um código vindo da URL (?error=) e sempre devolve uma string.
 * Considera só chaves próprias do mapa, para que códigos como "constructor" ou "__proto__"
 * não resolvam para itens herdados de Object.prototype.
 */
export function getErrorMessage(messages: Record<string, string>, code: unknown): string {
  // ?error= repetido na URL chega como array, então só aceita string
  if (typeof code === 'string' && Object.hasOwn(messages, code)) {
    const message = messages[code];
    if (typeof message === 'string') return message;
  }

  // Código desconhecido: usa a mensagem genérica do mapa
  const fallback = Object.hasOwn(messages, 'server_error') ? messages.server_error : undefined;
  return typeof fallback === 'string' ? fallback : GENERIC_ERROR_MESSAGE;
}
