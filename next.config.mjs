import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // O painel é dinâmico e muda por ação de outras pessoas: ao trocar de seção, sempre busca os dados
    // atuais no servidor em vez de reaproveitar por 30 s a tela já visitada (que ignoraria, por exemplo,
    // a forma de ver as tarefas guardada no cookie)
    staleTimes: { dynamic: 0 },
  },
};

/**
 * Valida a configuração obrigatória ao subir o servidor (next start / next dev)
 * O .env.local já foi carregado neste ponto; o build não exige o segredo (é lido só em runtime)
 * @param {string} phase - Fase atual do Next
 * @returns {import('next').NextConfig}
 */
export default function config(phase) {
  const isServerPhase = phase === PHASE_PRODUCTION_SERVER || phase === PHASE_DEVELOPMENT_SERVER;

  if (isServerPhase && !process.env.JWT_SECRET?.trim()) {
    throw new Error('JWT_SECRET não definido. Configure-o no .env.local (veja .env.example).');
  }

  return nextConfig;
}
