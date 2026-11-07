# VeciRed IA - Frontend Móvil (React Native + Expo)

Frontend móvil desarrollado para el Hackathon 2026, basado en el prototipo interactivo UX/UI y el esquema de base de datos de Supabase.

---

## 🎨 Paleta de Colores
* **Verde Azulado (Teal / Blue-Green)**: Color principal de la aplicación (`#0d9488`, `#0f766e`, `#115e59`) aplicado en cabeceras, tarjetas de servicios, botones primarios y barra de navegación.
* **Rojo (Crimson / Red)**: Exclusivo para el módulo de emergencias y alertas comunitarias (`#dc2626`, `#b91c1c`, `#fee2e2`).
* **Púrpura Comunitario (`#7c3aed`)**: Acentos de la cadena de favores y ayuda solidaria.

---

## 📱 Pantallas y Flujos Implementados

### 1. Onboarding / Login Inicial (Solo 1 vez al instalar)
* **Paso 1**: Bienvenida a la comunidad vecinal.
* **Paso 2**: Registro de número de celular y datos del vecino.
* **Paso 3**: Captura fotográfica del DNI con simulación OCR contra padrón distrital.
* **Paso 4**: Escaneo facial biométrico con prueba de vida (Liveness test).
* **Paso 5**: Geolocalización GPS en tiempo real (detección de Zona A, Manzana 2).
* **Paso 6**: Confirmación y selector de tamaño de fuente (`A Normal`, `A+ Grande`, `A++ Senior`).
* *Nota:* Una vez completado, el usuario entra directo a la app. En el perfil cuenta con un botón para **reiniciar la simulación del registro** cuando se desee presentar a los jueces.

### 2. Inicio (Home)
* Banner permanente superior en rojo de emergencia activa: `🚨 Alerta Activa: Inundación en Mz 2 (Zona A)`.
* Card Héroe en verde azulado: `¿Qué necesitas hoy?` con buscador IA y micrófono.
* Cuadrícula de 4 grandes áreas:
  1. **🔧 Servicios cercanos** (Oficios y profesionales)
  2. **🤝 Ayuda solidaria** (Cadena de favores)
  3. **🏪 Productos locales** (Comercio barrial)
  4. **🚨 Emergencias** (Coordinación vecinal en rojo)
* Sección de recomendados por tus vecinos: Servicio de gasfitería Marcos Soto (⭐ 4.8, 350 m, Vecino verificado).

### 3. Servicios de Proximidad
* Buscador con IA y selector horizontal de categorías.
* Radar de proximidad: **24 servicios disponibles a menos de 1 km**.
* Prestadores recomendados con *"Visto Bueno Vecinal"*, estrellas y botón directo de contacto por WhatsApp (Electricista Juan Torres, Repostería Doña Rosa, Jardinería Carlos M.).
* Banner rojo de activación de soporte en emergencias al pie.

### 4. Ayuda Solidaria (Cadena de Favores)
* Sub-tabs conmutadores: `[ 📋 Muro de Ayuda ]` y `[ 🚨 Economía Solidaria ]`.
* Contador de solidaridad activa en tiempo real: **Veces que has ayudado (12)** y **Veces que has recibido ayuda (4)**.
* Categorías (Herramientas, Apoyo temporal, Donaciones, Movilidad).
* Detalle de favor interactivo: Botón `🤝 Quiero ayudar` que incrementa el contador de solidaridad activa en tiempo real (+1).

### 5. Economía Solidaria (Apoyo en Emergencia)
* Cabecera y tarjeta en rojo: Inundación activa en Zona A - Manzana 2.
* Botones de acción: `+ Se necesita` y `🤝 Puedo aportar`.
* Necesidades de la zona con barras de progreso vivas:
  * **💧 Agua potable:** Se necesitan 20 botellas (8 comprometidas, faltan 12).
  * **🍴 Alimentos:** Se necesitan 15 packs (10 comprometidos, faltan 5).
  * **🛏️ Mantas y frazadas:** Se necesitan 10 unidades (3 comprometidas, faltan 7).
* Detalle interactivo con botón `🤝 Quiero aportar 2 botellas`, que actualiza la barra de progreso a 10 de 20 y suma al contador del usuario.

### 6. Centro de Emergencias y Alerta Activa
* 6 tipos de emergencia clasificados (Incendio, Inundación, Médica, Vivienda, Ayuda, Recursos).
* Radar de alerta vecinal (500 metros) y stepper de coordinación: *Reportada (9:10 am) ➔ En atención ➔ Atendida*.
* Brigada vecinal con botón interactivo `🤝 Quiero ayudar como voluntario`, sumando a Doña Martha en tiempo real.
* Botones de marcado directo a teléfonos oficiales: Bomberos (116), Policía (105), SAMU (106).

### 7. Publicar (Paso 2 y 3)
* Botón central flotante elevado con anillo oscuro y símbolo `+` en la barra inferior.
* **Paso 2:** Selección entre 6 modalidades (*Ofrecer servicio, Vender producto, Necesito ayuda, Puedo apoyar, Donar, Intercambiar*).
* **Paso 3:** Formulario de venta de producto vecinal (Pan casero S/ 0.50, foto, unidad, descripción, ubicación en Manzana 2 y switch de visibilidad para vecinos). Al publicar, muestra notificación de éxito y regresa al inicio.

### 8. Mi Perfil y Accesibilidad
* Credencial de residente verificada de Doña Martha Quispe.
* Selector de fuente accesible para adultos mayores: `A Normal` (1.0x), `A+ Grande` (1.15x), `A++ Senior` (1.30x).
* Lista de contactos favoritos guardados (Electricista Juan Torres).
* Botón para re-ejecutar el flujo de registro inicial con DNI y biometría.

---

## 🗄️ Alineación con la Base de Datos (Supabase)
Los datos estáticos en `src/data/mockData.js` reflejan fielmente las tablas y atributos del modelo relacional:
* `profiles` (`id`, `full_name`, `phone`, `account_status`, `font_scale_preference`, `solidarity_helped_count`, `solidarity_received_count`)
* `services` (`id`, `provider_id`, `title`, `price_from`, `rating_avg`, `endorsements_count`)
* `products` (`id`, `seller_id`, `name`, `price`, `unit`, `visible_to_neighbors`)
* `solidarity_posts` (`id`, `author_id`, `category`, `post_type`, `title`, `description`)
* `emergencies` (`id`, `emergency_type`, `title`, `severity`, `status`)
* `emergency_needs` (`id`, `emergency_id`, `resource_name`, `quantity_required`, `quantity_committed`)
* `emergency_volunteers` (`id`, `emergency_id`, `volunteer_id`, `role_assigned`, `volunteer_status`)

---

## 🚀 Cómo Ejecutar la Aplicación

1. Abre una terminal y dirígete a la carpeta del proyecto:
```bash
cd front_hacka
```

2. Inicia el servidor de desarrollo de Expo:
```bash
npx expo start
```

3. Elige cómo visualizarla:
* **En el navegador web**: Presiona la tecla `w`.
* **En tu teléfono Android / iOS**: Instala la app gratuita **Expo Go** y escanea el código QR que aparece en la terminal.
* **En emulador Android**: Presiona `a`.
