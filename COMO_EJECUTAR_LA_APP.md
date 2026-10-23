# 📱 Finanzas Fáciles — App Móvil Híbrida (React Native / Expo)

¡Tu nueva aplicación móvil nativa está lista y configurada en esta carpeta!

Esta versión reemplaza definitivamente las limitaciones y errores de permisos de Google Apps Script, ofreciéndote una **app moderna, offline-first y lista para tiendas (iOS App Store / Google Play Store)**.

---

## 🚀 ¿Cómo probar la App en tu propio celular en 2 minutos?

### Paso 1: Descarga la app de pruebas en tu teléfono
* **En iPhone:** Descarga [Expo Go en App Store](https://apps.apple.com/app/expo-go/id982107779).
* **En Android:** Descarga [Expo Go en Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent).

### Paso 2: Inicia el servidor de desarrollo en tu terminal
Abre una terminal en esta carpeta (`/Users/DylanRamirez/Downloads/Gemini Dylan/App finanzas`) y ejecuta:

```bash
npm start
```

*(Si tu terminal no reconoce `npm`, usa: `export PATH="/usr/local/bin:$PATH" && npm start`)*

### Paso 3: Escanea el código QR
* **En iPhone:** Abre la app de la **Cámara** y enfoca el código QR que aparecerá en tu terminal. Toca la notificación para abrir en Expo Go.
* **En Android:** Abre la app **Expo Go** y toca **Scan QR code**.
* **En tu computador (Web):** También puedes presionar la tecla `w` en la terminal para abrir la versión web en tu navegador.

---

## 💎 Características Principales Construidas:

1. **Dashboard Financiero Completo:**
   * **Dinero Libre Disponible** con porcentaje respecto a ingresos.
   * **Ingresos vs Egresos** (calculando pagos pendientes vs ya pagados).
   * **Barra de Progreso:** Porcentaje visual de compromisos cubiertos en el mes.
   * **Distribución de Gastos:** Bento grid con barras de categorías (Gastos fijos, Servicios, Deudas, Ahorro).
   * **Fondos y Metas:** Fondo de Emergencia, Meta Principal e Inversiones.
   * **Lista de Transacciones:** Checkboxes circulares táctiles (verde al estar pagado), emojis por categoría y acciones de eliminar.

2. **Escáner Bancario Inteligente:**
   * Pestaña dedicada **"📥 Escáner"**.
   * Pega cualquier notificación o SMS de **Bancolombia, Nu, Davivienda, Falabella, Nequi o PSE**.
   * La app extrae el comercio, el monto exacto en pesos COP, el medio de pago y te sugiere la categoría adecuada.
   * Con un toque en **"＋ Agregar al Mes"** queda registrado en tus gastos.

3. **Multi-Mes (Proyección en 840 Meses):**
   * Selector superior para cambiar entre meses (ej. `octubre 428/840`, `noviembre 429/840`).
   * Botón **"📋 Nuevo Mes"** que duplica tus gastos fijos pero reinicia todos los pagos en estado pendiente.

4. **Exportador Nativo a Excel (.xlsx):**
   * Botón superior **"📊 Exportar Excel"**.
   * Genera al instante un archivo de Excel idéntico al que tenías en Google Sheets, con columnas `Tipo`, `Categoría`, `Descripción`, `Monto` y `Pagado`, más el encabezado de metas y resumen.
   * Tus usuarios nunca sentirán que perdieron la hoja de cálculo.

5. **Modo Oscuro OLED y Modo Claro Crema:**
   * Alterna en tiempo real con el botón **"◐ Tema"**.

---

## 🛠️ Estructura del Código:

```
App finanzas/
├── App.js                  # Pantallas, navegación, modales y lógica principal
├── app.json                # Identificadores nativos para App Store y Play Store
├── package.json            # Dependencias del proyecto (Expo SDK 52)
├── src/
│   ├── theme/index.ts      # Paleta de colores OLED y Crema Monai
│   ├── types/index.ts      # Modelos de datos (Movimiento, Meta, Mes)
│   └── services/
│       ├── storage.ts      # Almacenamiento local offline-first (AsyncStorage)
│       ├── bankScanner.ts  # Analizador regex de notificaciones bancarias de Colombia
│       └── excelExport.ts  # Generador de archivos .xlsx reales
└── legacy-apps-script/     # Archivos anteriores de Apps Script guardados como respaldo
```
