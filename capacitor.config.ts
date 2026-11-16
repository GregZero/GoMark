import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gregzero.gomark',
  appName: 'GoMark',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    BarcodeScanner: {
      cameraDirection: 'back'
    }
  }
};

export default config;
