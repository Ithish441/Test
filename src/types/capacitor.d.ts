import '@capacitor/core';
import type { PluginConfig } from '@capacitor/core';

declare module '@capacitor/core' {
  interface PluginConfig {
    Config: {
      /** Splash Screen configuration */
      SplashScreen?: {
        launchShowDuration?: number;
        backgroundColor?: string;
        androidSplashResourceName?: string;
        androidAdaptableSplashFactor?: number;
      };
    };
  }
}

export {};
