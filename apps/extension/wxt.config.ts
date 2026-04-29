import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  manifest: {
    name: 'Flowkit',
    description: 'Focus intelligence for developers and power users.',
    version: '0.1.0',
    permissions: [
      'storage',
      'alarms',
      'notifications',
      'tabs',
      'idle',
    ],
    host_permissions: [
      'http://localhost:3000/*',
      'https://api.flowkit.app/*',
    ],
    action: {
      default_popup: 'entrypoints/popup/index.html',
      default_icon: {
        '16': 'icons/16.png',
        '32': 'icons/32.png',
        '48': 'icons/48.png',
        '128': 'icons/128.png',
      },
    },
    icons: {
      '16': 'icons/16.png',
      '32': 'icons/32.png',
      '48': 'icons/48.png',
      '128': 'icons/128.png',
    },
  },
});
