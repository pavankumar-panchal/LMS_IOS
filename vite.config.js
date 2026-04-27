import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-transform-class-properties', { loose: true }],
          ['@babel/plugin-transform-private-methods', { loose: true }],
          ['@babel/plugin-transform-private-property-in-object', { loose: true }],
          'react-native-reanimated/plugin',
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      // Map react-native → compiled dist of react-native-web (not src, avoids Flow issues)
      'react-native': path.resolve(__dirname, 'node_modules/react-native-web/dist/cjs'),
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'web/AsyncStorageWeb.js'),
    },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
  },

  define: {
    __DEV__: JSON.stringify(true),
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify('development'),
  },

  optimizeDeps: {
    include: [
      'react-native-web',
      'react-native-reanimated',
      'react-native-gesture-handler',
      'react-native-safe-area-context',
      'react-native-screens',
      'react-native-paper',
    ],
    esbuildOptions: {
      jsx: 'automatic',
      loader: { '.js': 'jsx' },
      resolveExtensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx'],
      alias: {
        'react-native': path.resolve(__dirname, 'node_modules/react-native-web/dist/cjs/index.js'),
      },
    },
  },

  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
