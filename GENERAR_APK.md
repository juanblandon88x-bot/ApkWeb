# Cómo Generar el APK de SIRNET Streaming

## Requisitos previos

1. **Android Studio** instalado
   - Descarga: https://developer.android.com/studio
   
2. **Java JDK 17** o superior
   - Descarga: https://adoptium.net/

3. **Variables de entorno configuradas**:
   - `JAVA_HOME` apuntando a tu JDK
   - `ANDROID_HOME` apuntando al SDK de Android

## Pasos para generar APK de prueba (Debug)

```bash
# 1. Entrar a la carpeta del proyecto
cd "Pruebas Panel"

# 2. Compilar y sincronizar
npm run build
npx cap sync android

# 3. Abrir en Android Studio
npx cap open android
```

En Android Studio:
1. Espera a que Gradle sincronice
2. Ve a **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

## Generar APK de producción (Release)

### 1. Crear keystore (solo la primera vez)

```bash
keytool -genkey -v -keystore sirnet-release.keystore -alias sirnet -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configurar firma en `android/app/build.gradle`

Agrega dentro de `android { }`:

```gradle
signingConfigs {
    release {
        storeFile file('sirnet-release.keystore')
        storePassword 'TU_PASSWORD'
        keyAlias 'sirnet'
        keyPassword 'TU_PASSWORD'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### 3. Generar APK firmado

```bash
cd android
./gradlew assembleRelease
```

El APK estará en: `android/app/build/outputs/apk/release/app-release.apk`

## Personalizar la app

### Cambiar ícono
1. Coloca tu ícono (1024x1024 PNG) en `resources/icon.png`
2. Ejecuta: `npx capacitor-assets generate`

### Cambiar splash screen
1. Coloca tu imagen (2732x2732 PNG) en `resources/splash.png`
2. Ejecuta: `npx capacitor-assets generate`

### Cambiar nombre de la app
Edita `capacitor.config.ts`:
```typescript
appName: 'SIRNET Streaming',
```

### Cambiar ID de la app
Edita `capacitor.config.ts`:
```typescript
appId: 'com.sirnet.streaming',
```

## Comandos útiles

```bash
# Compilar y abrir en Android Studio
npm run cap:android

# Ejecutar en dispositivo/emulador conectado
npm run cap:run:android

# Generar APK debug
npm run apk:debug

# Generar APK release
npm run apk:release
```

## Solución de problemas

### Error: SDK location not found
Crea el archivo `android/local.properties`:
```
sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
```

### Error: JAVA_HOME not set
Configura la variable de entorno JAVA_HOME apuntando a tu JDK.

### La app no carga contenido
Verifica que la URL de tu API en `src/lib/api.ts` sea accesible desde el dispositivo.
Para desarrollo local, usa tu IP de red (ej: 192.168.1.100) en vez de localhost.
