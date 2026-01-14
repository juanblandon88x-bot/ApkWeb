import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { SplashScreen } from '@capacitor/splash-screen';

// Detectar si estamos en app nativa
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'android', 'ios', 'web'

// Inicializar plugins de Capacitor
export async function initCapacitor() {
  if (!isNative) return;

  try {
    // Ocultar splash screen después de cargar
    await SplashScreen.hide();

    // Configurar status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0c111b' });

    // Manejar botón atrás en Android
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

    // Listener para cuando la app vuelve al frente
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state:', isActive ? 'active' : 'background');
    });

    // Listener para teclado (útil para inputs)
    Keyboard.addListener('keyboardWillShow', (info) => {
      console.log('Keyboard height:', info.keyboardHeight);
    });

  } catch (error) {
    console.error('Error initializing Capacitor:', error);
  }
}

// Verificar conexión a internet
export async function checkNetwork(): Promise<boolean> {
  if (!isNative) return navigator.onLine;
  
  const status = await Network.getStatus();
  return status.connected;
}

// Listener para cambios de red
export function onNetworkChange(callback: (connected: boolean) => void) {
  if (!isNative) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
    return;
  }

  Network.addListener('networkStatusChange', (status) => {
    callback(status.connected);
  });
}

// Salir de la app (solo Android)
export async function exitApp() {
  if (isNative && platform === 'android') {
    await App.exitApp();
  }
}

// Obtener info de la app
export async function getAppInfo() {
  if (!isNative) return null;
  return await App.getInfo();
}
