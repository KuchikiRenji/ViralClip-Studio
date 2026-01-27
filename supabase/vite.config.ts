import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_SOUNDHELIX_TARGET = 'https://www.soundhelix.com/examples/mp3/';
const ENV_PREFIX = '';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', ENV_PREFIX);
  const resolvedPort = Number(env.VITE_DEV_SERVER_PORT ?? DEFAULT_PORT);
  const validPort = Number.isFinite(resolvedPort) && resolvedPort > 0 ? resolvedPort : DEFAULT_PORT;
  const resolvedHost = env.VITE_DEV_SERVER_HOST ?? DEFAULT_HOST;
  const soundhelixTarget = env.VITE_SOUNDHELIX_TARGET ?? DEFAULT_SOUNDHELIX_TARGET;
  const currentDir = dirname(fileURLToPath(import.meta.url));

  return {
    plugins: [react()],
    server: {
      port: validPort,
      host: resolvedHost,
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
      proxy: {
        '/media/soundhelix/': {
          target: soundhelixTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/media\/soundhelix\//, ''),
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(currentDir, './src'),
      },
    },
  };
});
