import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  let backendTarget = 'http://localhost:5000';
  if (env.VITE_API_URL) {
    try {
      if (env.VITE_API_URL.startsWith('http://') || env.VITE_API_URL.startsWith('https://')) {
        backendTarget = new URL(env.VITE_API_URL).origin;
      }
    } catch {
      backendTarget = env.VITE_API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});

