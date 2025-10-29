import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// Custom plugin to handle admin subdomain routing in dev
const adminSubdomainPlugin = () => {
  return {
    name: 'admin-subdomain',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const host = req.headers.host;
        if (host && host.startsWith('admin.') && req.url === '/') {
          // If on admin subdomain and requesting root, serve admin.html
          req.url = '/admin.html';
        }
        next();
      });
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss(), adminSubdomainPlugin()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      port: 3000,
      allowedHosts: ['acme.dev.stagehanddev.com', 'momentum.dev.stagehanddev.com', 'admin.dev.stagehanddev.com'],
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
            });
          },
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'admin.html'),
        },
      },
    },
  }
}); 