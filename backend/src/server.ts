import 'dotenv/config';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { loadEnv } from './config/env.js';
import { createLogger } from './config/logger.js';
import { createContainer } from './container.js';

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
});
const app = createApp({ container, logger, corsOrigins: env.CORS_ORIGIN });

const server = app.listen(env.PORT, () => {
  logger.info(`API ouvindo em http://localhost:${env.PORT}`);
});

// Encerramento gracioso: para de aceitar conexões e fecha o banco antes de sair.
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} recebido, encerrando...`);
  server.close();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
