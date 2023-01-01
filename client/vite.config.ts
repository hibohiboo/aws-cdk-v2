import reactRefresh from '@vitejs/plugin-react-refresh'
import { defineConfig } from 'vite'
const basePath = 'aws-cdk-v2-sample'
const dev = process.env.npm_lifecycle_event === 'dev';

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
          amplify: ['aws-amplify'],
          rum: ['aws-rum-web']
        },
      },
    },
  },
  esbuild: {
    drop: dev ? [] : ['console'],
  },
  plugins: [reactRefresh(),],
  root: '.',
  resolve: {
    // viteのホットリロードのために、/で始める必要がある。
    alias: [
      { find: '@', replacement: '/src' },
      // https://ui.docs.amplify.aws/react/getting-started/troubleshooting
      // aws-amplify で、 Uncaught ReferenceError: global is not defined と言われてしまうこと対策
      {
        find: './runtimeConfig',
        replacement: './runtimeConfig.browser',
      },
    ],
  },
  define: {
    VITE_DEFINE_BASE_PATH: JSON.stringify(basePath),
  },
  base: `/${basePath}/`,
  server: {
    host: true, // 開発サーバ外部のネットワークにアクセス可能にする。（vite v2の動きを踏襲）
    port: 3000,
  },
})
