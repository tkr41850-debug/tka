/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function resolvePagesBase() {
  const repositorySlug = process.env.GITHUB_REPOSITORY?.split('/')[1];

  if (!repositorySlug || process.env.GITHUB_ACTIONS !== 'true') {
    return '/';
  }

  if (repositorySlug.endsWith('.github.io')) {
    return '/';
  }

  return `/${repositorySlug}/`;
}

export default defineConfig({
  base: resolvePagesBase(),
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
