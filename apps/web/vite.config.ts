import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteCompression from 'vite-plugin-compression';

/**
 * Build stamp.
 *
 * Answers "is the live site actually current?" in one request instead of
 * fetching the hashed JS bundle and grepping it for a string you hope changed.
 * Three wrong conclusions were drawn about deploy state before this existed —
 * twice "it is stale" when it was mid-deploy, once "it is live" when it was not.
 *
 * VERCEL_GIT_COMMIT_SHA is injected by Vercel; falls back to "dev" locally.
 */
const BUILD_COMMIT =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || process.env.GIT_COMMIT?.slice(0, 7) || 'dev';
const BUILT_AT = new Date().toISOString();

export default defineConfig(({ mode }) => ({
  define: {
    __BUILD_COMMIT__: JSON.stringify(BUILD_COMMIT),
    __BUILT_AT__: JSON.stringify(BUILT_AT),
  },
  plugins: [
    react(),
    // Gzip compression for production builds only
    ...(mode === 'production'
      ? [
          viteCompression({
            algorithm: 'gzip',
            ext: '.gz',
            threshold: 1024, // Only compress files > 1KB
          }),
          // Brotli compression (better compression ratio)
          viteCompression({
            algorithm: 'brotliCompress',
            ext: '.br',
            threshold: 1024,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@gem/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@gem/types': path.resolve(__dirname, '../../packages/types/src'),
      '@gem/utils': path.resolve(__dirname, '../../packages/utils/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    // Disable source maps in production for smaller bundles
    sourcemap: mode === 'development',
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.logs in production
        drop_debugger: mode === 'production', // Remove debugger statements in production
      },
    },
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - cached separately
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'vendor-utils': ['date-fns', 'zustand', 'sonner'],
        },
        // Clean chunk names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit (we're intentionally chunking)
    chunkSizeWarningLimit: 500,
  },
}));
