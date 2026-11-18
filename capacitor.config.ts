import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tenglish.app',
  appName: 'T-English',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#0C0E14',
  },
  server: {
    iosScheme: 'tenglish',
  },
};

export default config;
