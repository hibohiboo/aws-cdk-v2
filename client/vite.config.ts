import reactRefresh from '@vitejs/plugin-react-refresh'
import { terser } from 'rollup-plugin-terser'
import { defineConfig } from 'vite'
const basePath = 'aws-cdk-v2-sample'

export default defineConfig({
  build: {
    outDir: 'build',
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          reactFamily: ['react-router-dom'],
          rtk: ['react-redux', '@reduxjs/toolkit'],
          others: ['lodash', 'web-vitals', 'date-fns'],
        },
      },
    },
  },
  plugins: [reactRefresh(), terser({ compress: { drop_console: true } })],
  root: '.',
  resolve: {
    // viteのホットリロードのために、/で始める必要がある。
    alias: [{ find: '@', replacement: '/src' }],
  },
  define: {
    VITE_DEFINE_BASE_PATH: JSON.stringify(basePath),
  },
  base: `/${basePath}/`,
})
