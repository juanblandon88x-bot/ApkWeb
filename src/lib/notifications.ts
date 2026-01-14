/**
 * Sistema de notificaciones push para SIRNET
 */

// Registrar Service Worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
      return null;
    }
  }
  return null;
}

// Solicitar permiso para notificaciones
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Suscribirse a notificaciones push
export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    // Necesitarías una VAPID key real de tu servidor
    const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY';
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey
    });
    
    console.log('Suscripción push:', subscription);
    return subscription;
  } catch (error) {
    console.error('Error suscribiendo a push:', error);
    return null;
  }
}

// Mostrar notificación local
export function showLocalNotification(title: string, body: string, icon?: string): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/logo192.png',
      badge: '/logo192.png',
      tag: 'sirnet-notification'
    });
  }
}

// Notificación de nuevo contenido
export function notifyNewContent(contentName: string): void {
  showLocalNotification(
    '¡Nuevo contenido disponible!',
    `${contentName} ya está disponible para ver`,
    '/logo192.png'
  );
}

// Notificación de recordatorio
export function notifyReminder(contentName: string): void {
  showLocalNotification(
    'Continúa viendo',
    `¿Quieres seguir viendo ${contentName}?`,
    '/logo192.png'
  );
}

// Inicializar sistema de notificaciones
export async function initNotifications(): Promise<void> {
  const registration = await registerServiceWorker();
  if (registration) {
    const hasPermission = await requestNotificationPermission();
    if (hasPermission) {
      console.log('Notificaciones habilitadas');
    }
  }
}
