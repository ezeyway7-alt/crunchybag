import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const backend = process.env.VITE_BACKEND_ORIGIN || 'https://crunchybag.com';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: true,
      proxy: {
        '/ws': { target: backend, ws: true, changeOrigin: true },
        '/media': { target: backend, changeOrigin: true },
        '/api': {
          target: backend,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Host', new URL(backend).host);
              proxyReq.removeHeader('x-forwarded-host');
            });
          },
        },
        '/admin/login': {
          target: backend,
          changeOrigin: true,
          secure: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
