// Must be first import — initialises Reanimated's web worklet runtime
import 'react-native-reanimated';

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';

console.log('[web] Mounting app...');

const container = document.getElementById('root');
if (!container) {
  console.error('[web] #root element not found!');
} else {
  const root = createRoot(container);
  root.render(<App />);
  console.log('[web] App rendered');
}
