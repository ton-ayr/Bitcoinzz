import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { loadEnv } from './config/env.js';
import { createLogger } from './config/logger.js';
import { createContainer } from './container.js';

// Carrega o backend/.env, se existir (recurso nativo do Node, sem biblioteca).
// Variáveis já definidas no ambiente (ex.: painel do Render) têm prioridade sobre o arquivo.
try {
  process.loadEnvFile();
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

const env = loadEnv();
const logger = createLogger(env);

try {
  await connectDatabase(env.MONGODB_URI);
  logger.info('Conectado ao MongoDB');
} catch (error) {
  logger.fatal(
    { err: error },
    'Não foi possível conectar ao MongoDB. Confira a MONGODB_URI (usuário, senha e liberação de IP no Atlas).',
  );
  process.exit(1);
}

const container = createContainer({
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  logger,
  quote: { apiUrl: env.QUOTE_API_URL, cacheTtlSeconds: env.QUOTE_CACHE_TTL_SECONDS },
  mail: {
    mailjet:
      env.MAILJET_API_KEY && env.MAILJET_SECRET_KEY && env.MAIL_FROM_EMAIL
        ? {
            apiKey: env.MAILJET_API_KEY,
            secretKey: env.MAILJET_SECRET_KEY,
            fromEmail: env.MAIL_FROM_EMAIL,
            fromName: env.MAIL_FROM_NAME,
          }
        : undefined,
  },
});
const app = createApp({
  container,
  logger,
  corsOrigins: env.CORS_ORIGIN,
  // Em produção a API fica atrás do proxy do Render; localmente não há proxy.
  trustProxy: env.NODE_ENV === 'production',
});

const server = app.listen(env.PORT, () => {
  logger.info(`API ouvindo em http://localhost:${env.PORT}`);
});

// Coleta da cotação a cada 10 min + preenchimento das lacunas das últimas 24 h.
void container.historyJob.start();

// Encerramento gracioso: para de aceitar conexões, espera as requisições em andamento
// terminarem e só então fecha o banco.
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} recebido, encerrando...`);
  await container.historyJob.stop();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
