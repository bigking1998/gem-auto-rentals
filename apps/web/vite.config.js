var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteCompression from 'vite-plugin-compression';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    return ({
        plugins: __spreadArray([
            react()
        ], (mode === 'production' ? [
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
        ] : []), true),
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
    });
});
