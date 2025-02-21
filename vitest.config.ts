import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { UserConfig as ViteUserConfig } from 'vite';
import type { InlineConfig as VitestInlineConfig } from 'vitest';

interface UserConfig extends ViteUserConfig {
  test: VitestInlineConfig;
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        'test/',
        '**/*.config.{js,ts}',
      ],
    },
  },
} as UserConfig);