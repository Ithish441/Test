import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';

export async function initializeCapacitor(): Promise<void> {
  try {
    await App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        console.log('App moved to background');
      }
    });

    await App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      }
    });

    Keyboard.addListener('keyboardWillShow', (info: { keyboardHeight: number }) => {
      console.log('Keyboard will show:', info);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      console.log('Keyboard will hide');
    });

    console.log('Capacitor initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Capacitor:', error);
  }
}

export async function triggerHapticFeedback(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
  try {
    const impactStyles: Record<string, ImpactStyle> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    
    await Haptics.impact({ style: impactStyles[style] });
  } catch (error) {
    console.error('Haptic feedback failed:', error);
  }
}

export async function openExternalLink(url: string): Promise<void> {
  window.open(url, '_blank');
}
