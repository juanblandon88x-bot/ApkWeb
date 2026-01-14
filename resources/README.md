# Recursos para la App

## Íconos necesarios

Coloca aquí los siguientes archivos:

### icon.png
- Tamaño: 1024x1024 px
- Formato: PNG con fondo transparente o sólido
- Uso: Ícono de la app

### splash.png  
- Tamaño: 2732x2732 px
- Formato: PNG
- Uso: Pantalla de carga
- Color de fondo recomendado: #0c111b

## Generar recursos automáticamente

Una vez tengas los archivos, ejecuta:

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate
```

Esto generará automáticamente todos los tamaños necesarios para Android e iOS.

## Colores de la app

- Fondo principal: #0c111b
- Azul primario: #0063e5
- Azul claro: #0080ff
- Texto: #ffffff
