/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { writeFileSync, mkdirSync } from 'node:fs';

const env = process.env.VITE_ENV === 'lab' ? 'lab' : 'prod';
const base = process.env.VITE_BASE ?? '/';
const version = process.env.VITE_APP_VERSION ?? 'dev';
// Fecha del commit (no del reloj): reconstruir el mismo commit da bytes idénticos y no dispara avisos de actualización.
const builtAt = process.env.VITE_BUILD_DATE ?? 'dev';

export default defineConfig({
  base,
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(builtAt),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: env === 'lab' ? 'AGE C1 · Laboratorio' : 'Preparador AGE C1',
        short_name: env === 'lab' ? 'AGE C1 Lab' : 'AGE C1',
        description: 'Tests por tema y simulacros del examen de Administrativo del Estado (C1).',
        lang: 'es',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#f4f6f8',
        theme_color: env === 'lab' ? '#8a4b00' : '#1f2a6b',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        cacheId: `agec1-${env}`,
        navigateFallbackDenylist: env === 'prod' ? [/\/laboratorio\//] : [],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        globIgnores: ['version.json'],
        cleanupOutdatedCaches: true,
      },
    }),
    {
      name: 'emit-version-json',
      closeBundle() {
        mkdirSync('dist', { recursive: true });
        writeFileSync('dist/version.json', JSON.stringify({ version, env, builtAt }));
      },
    },
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    globals: false,
  },
});
