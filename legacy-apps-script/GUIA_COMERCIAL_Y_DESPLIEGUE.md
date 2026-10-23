# 🚀 Finanzas Fáciles — Guía Maestra de Despliegue y Venta (Modelo PWA)

Esta guía contiene la arquitectura exacta y los pasos comerciales para vender tu sistema como una **PWA instalable (Sin tiendas)** garantizando que tus clientes tengan una experiencia fluida, profesional y sin fricciones técnicas.

---

## 🏗️ 1. ¿Cómo funciona la arquitectura para tus clientes?

1. **Tú eres el creador:** Tienes tu Google Sheet maestro y tu código en Apps Script desplegado como Web App.
2. **El cliente compra:** Recibe un enlace de copia automática (`/copy`).
3. **El cliente autoriza una sola vez:** Se conecta con su propia cuenta de Google (lo que garantiza privacidad total).
4. **Instala la PWA:** Fija la aplicación en la pantalla de inicio de su iPhone o Android.
5. **Uso diario:** Abre la app desde el ícono en su celular a pantalla completa. **Nunca necesita abrir el Excel a mano.**

---

## ⚙️ 2. Paso a Paso: Cómo Implementar tu Web App en Apps Script

Para que cualquier comprador pueda usar la PWA desde su propio teléfono:

1. Abre tu hoja maestra de Google Sheets.
2. Ve al menú superior: **Extensiones ➔ Apps Script**.
3. Pega el contenido de [Code.gs](file:///Users/DylanRamirez/Downloads/Gemini%20Dylan/App%20finanzas/Code.gs) y [Index.html](file:///Users/DylanRamirez/Downloads/Gemini%20Dylan/App%20finanzas/Index.html).
4. Arriba a la derecha, haz clic en el botón azul **Implementar ➔ Nueva implementación**.
5. Haz clic en el ícono de engranaje (⚙️) al lado de "Seleccionar tipo" y elige **Aplicación web**.
6. Configura estos campos **EXACTAMENTE ASÍ**:
   * **Descripción:** `Finanzas Fáciles PWA v1.0`
   * **Ejecutar como:** `El usuario que accede a la aplicación web` *(User accessing the web app)*.  
     *(⚠️ CRÍTICO: Esto hace que la app use el correo y la hoja del propio comprador, protegiendo la privacidad y garantizando costo \$0 de servidor).*
   * **Quién tiene acceso:** `Cualquier persona con una cuenta de Google` *(Anyone with a Google Account)*.
7. Haz clic en **Implementar**.
8. Copia la **URL de la aplicación web** generada (termina en `/exec`).

---

## 🎁 3. El "Enlace Mágico de Copia" para Entregar a tus Compradores

Cuando vendas tu producto en plataformas como **Hotmart, Gumroad, Shopify o MercadoPago**, no les des acceso como lectores o editores a tu archivo original.

Usa el truco del enlace de copia automática de Google:

1. Abre tu hoja de cálculo maestra.
2. Arriba a la derecha en **Compartir**, asegúrate de que el acceso general esté en:
   * **Cualquier persona con el enlace:** `Lector`.
3. Copia el enlace de tu hoja, que tiene este formato:
   `https://docs.google.com/spreadsheets/d/15zeBqmLwJ-U5NLtzKg7d76jBiRWAgt6p3-7h5l1K1XQ/edit?usp=sharing`
4. Cambia la palabra `/edit...` al final por `/copy`. Quedará así:
   `https://docs.google.com/spreadsheets/d/15zeBqmLwJ-U5NLtzKg7d76jBiRWAgt6p3-7h5l1K1XQ/copy`

> **¿Qué pasa cuando el cliente abre este enlace?**  
> Google le muestra una pantalla limpia con un botón azul que dice: **"¿Deseas crear una copia de Finanzas Fáciles?"**. Al tocarlo, Google duplica el sistema en su propio Google Drive en 2 segundos.

---

## 🛡️ 4. El "Kit Anti-Miedo" para la Autorización de Google

Como tu app incluye el **escáner de correos bancarios** (`GmailApp`), la primera vez que el comprador abre la aplicación, Google le pedirá autorizar el acceso.

Para que el cliente no se asuste con el aviso de *"Google no ha verificado esta aplicación"*, prepárale un instructivo visual (o video de 45 segundos) con este mensaje:

### 📄 Texto sugerido para la página de agradecimiento / entrega:

> ### 🔒 Nota importante sobre tu privacidad y seguridad:
> *"Finanzas Fáciles está diseñado para que tus finanzas sean **100% privadas**. A diferencia de otras apps bancarias, **ninguno de tus datos viaja a servidores de terceros ni a nuestras manos**; todo se ejecuta dentro de tu propia cuenta de Google.*
>
> *Al abrir tu app por primera vez:*
> 1. *Inicia sesión con tu cuenta de Google.*
> 2. *Toca en **Configuración avanzada** (o 'Advanced').*
> 3. *Toca en **Ir a Finanzas Fáciles (no seguro)**. (Google muestra este aviso estándar porque la app se conecta de forma privada a tu propio correo para leer tus notificaciones bancarias sin intermediarios).*
> 4. *Haz clic en **Permitir**.*
> 
> *¡Listo! A partir de este momento, solo toca **📱 Instalar en Celular** y úsala directamente desde tu pantalla de inicio todos los días."*

---

## 📱 5. Instalación PWA en los Teléfonos de los Compradores

La versión actualizada de [Index.html](file:///Users/DylanRamirez/Downloads/Gemini%20Dylan/App%20finanzas/Index.html) incluye detección automática:

* **En Android (Chrome):** La aplicación detecta el evento del sistema y habilita un botón directo verde: **"📲 Instalar Finanzas Fáciles"**, agregándola a la lista de apps del teléfono en 1 clic.
* **En iPhone (Safari):** El modal de instalación le muestra los pasos exactos ilustrados:
  1. Tocar el botón **Compartir** (📤).
  2. Seleccionar **"Agregar a inicio"** (📱).
  3. Tocar **Añadir**.
* Una vez instalada, la app oculta automáticamente los botones de instalación y muestra el badge **"✓ App Instalada"**, funcionando a pantalla completa con navegación fluida y modo oscuro OLED.

---

## 🔧 6. ¿Por qué ocurría el "Error de permisos para grabar" y cómo quedó solucionado?

* **La Causa:** Cuando un usuario nuevo abría la Web App general, el script intentaba escribir por defecto en tu **hoja maestra original** (la de Dylan). Como tus compradores solo tienen permiso de *Lector* en tu hoja maestra para no sobreescribir tus datos, Google bloqueaba la grabación diciendo: *"No tienes permisos para modificar este documento"*.
* **La Solución Implementada:**
  1. **Vinculación dinámica de ID:** La función `onOpen()` en [Code.gs](file:///Users/DylanRamirez/Downloads/Gemini%20Dylan/App%20finanzas/Code.gs) ahora detecta automáticamente el ID único de la copia del comprador y actualiza el botón verde de su hoja a:  
     `https://script.google.com/macros/s/.../exec?id=ID_DE_SU_COPIA`  
     Así, cuando el usuario hace clic, la Web App se conecta **exclusivamente a su propia hoja**, donde él es el dueño absoluto y tiene 100% permisos de lectura y escritura.
  2. **Búsqueda inteligente en Drive:** Si el usuario abre la app sin el parámetro `?id=`, el script busca automáticamente en su Google Drive su archivo personal de *Finanzas Fáciles*, ignorando la hoja maestra.
  3. **Protección si no ha creado copia:** Si un usuario entra a la Web App antes de haber hecho una copia, la app ya no falla con un error feo de Google: le muestra una pantalla limpia con un botón verde que dice **"🚀 Crear mi Copia en Google Drive"**. Al crearla, queda vinculado de por vida.
