import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.roomrent.app',
  appName: 'Room Rent',
  // Angular's application builder emits the browser bundle under /browser.
  webDir: 'dist/room-rent-frontend/browser',
};

export default config;
