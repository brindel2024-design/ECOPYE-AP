import { loadConfig } from '@ecopye/config';
import { buildApp } from './app.js';

const config = loadConfig();

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: config.API_PORT, host: config.API_HOST });
    app.log.info(
      { port: config.API_PORT, env: config.NODE_ENV },
      `🟢 ECOPYE API ready on ${config.API_PUBLIC_URL}${config.API_PREFIX}`,
    );
  } catch (err) {
    app.log.fatal({ err }, 'Failed to start API');
    process.exit(1);
  }
}

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    // eslint-disable-next-line no-console
    console.log(`\n${sig} received, shutting down…`);
    process.exit(0);
  });
}

main();
