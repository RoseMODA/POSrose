# Rosema POS - Sistema de Punto de Venta

Sistema completo de punto de venta desarrollado con React, Vite y Firebase para la tienda de ropa Rosema.

## 🚀 Características

### Autenticación y Usuarios
- ✅ Sistema de login con Firebase Authentication
- ✅ Roles de usuario (Administrador y Vendedor)
- ✅ Gestión de permisos por rol
- ✅ Perfil de usuario personalizable

### Dashboard y Navegación
- ✅ Dashboard principal con métricas rápidas
- ✅ Menú lateral responsive
- ✅ Navegación intuitiva entre secciones
- ✅ Interfaz optimizada para computadoras y tablets

### Gestión de Ventas
- ✅ Carrito de compras interactivo
- ✅ Búsqueda de productos por código o nombre
- ✅ Modificación de cantidades y eliminación de productos
- ✅ Cálculo automático de totales
- ✅ Sistema de descuentos (porcentaje o monto fijo)
- ✅ Múltiples métodos de pago (efectivo, transferencia, débito, crédito)
- ✅ Opción para registrar cambios/devoluciones
- ✅ Actualización automática de stock
- ✅ Impresión de recibos

### Gestión de Productos
- ✅ CRUD completo de productos
- ✅ Campos: nombre, código, precios, categoría, tags, talles, stock
- ✅ Cálculo automático de porcentaje de ganancia
- ✅ Carga de múltiples imágenes
- ✅ Asociación con proveedores
- ✅ Control de stock con alertas

### Gestión de Proveedores
- ✅ CRUD completo de proveedores
- ✅ Información de contacto (hasta 3 números de WhatsApp)
- ✅ Dirección y ubicación (galería, local)
- ✅ Tags de tipos de productos que proveen
- ✅ Redes sociales y sitio web
- ✅ CUIT y ranking de calidad
- ✅ Notas adicionales

### Gestión de Facturas ARCA
- ✅ CRUD de facturas con carga de archivos
- ✅ Soporte para PDF e imágenes
- ✅ Almacenamiento seguro en Firebase Storage
- ✅ Diferentes tipos de documentos (facturas, notas de crédito/débito)
- ✅ Búsqueda y filtrado

### Estadísticas y Reportes
- ✅ Métricas de ventas (diarias, semanales, mensuales)
- ✅ Análisis de productos más vendidos
- ✅ Métodos de pago más utilizados
- ✅ Total en activos y total invertido
- ✅ Alertas de stock bajo
- ✅ Filtros de fecha personalizables

## 🎨 Diseño

### Paleta de Colores
- **Principal**: #d63629 (rojo Rosema)
- **Secundario**: #222222 (gris oscuro)
- **Terciario**: #ffffff (blanco)
- **Acentos**: Varios tonos de gris

### Características de Diseño
- ✅ Interfaz moderna y limpia
- ✅ Responsive design para computadoras y tablets
- ✅ Tipografía Google Fonts (Inter)
- ✅ Sin dependencias de librerías de iconos externas
- ✅ Animaciones y transiciones suaves

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19 + Vite
- **Styling**: TailwindCSS
- **Backend**: Firebase (Authentication, Firestore, Storage, Hosting)
- **Routing**: React Router DOM
- **Validaciones**: Funciones personalizadas
- **Formateo**: Intl API para moneda argentina

## 📁 Estructura del Proyecto

```
rosema-pos/
├── public/
├── src/
│   ├── assets/          # Imágenes y archivos estáticos
│   ├── components/      # Componentes reutilizables
│   │   ├── LoadingSpinner.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── Sidebar.jsx
│   ├── contexts/        # Contextos de React
│   │   └── AuthContext.jsx
│   ├── pages/           # Páginas principales
│   │   ├── Dashboard.jsx
│   │   ├── Estadisticas.jsx
│   │   ├── Facturas.jsx
│   │   ├── Login.jsx
│   │   ├── Productos.jsx
│   │   ├── Proveedores.jsx
│   │   └── Ventas.jsx
│   ├── services/        # Configuración de Firebase
│   │   └── firebase.js
│   ├── utils/           # Funciones auxiliares
│   │   ├── format.js
│   │   └── validations.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── firebase.json        # Configuración de Firebase
├── firestore.rules      # Reglas de seguridad de Firestore
├── firestore.indexes.json # Índices de Firestore
├── storage.rules        # Reglas de seguridad de Storage
├── .firebaserc         # Configuración del proyecto Firebase
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn
- Cuenta de Firebase
- Firebase CLI instalado globalmente

```bash
npm install -g firebase-tools
```

### Paso 1: Clonar y Configurar el Proyecto

```bash
# Navegar al directorio del proyecto
cd rosema-pos

# Instalar dependencias
npm install
```

### Paso 2: Configurar Firebase

1. **Crear proyecto en Firebase Console**:
   - Ve a [Firebase Console](https://console.firebase.google.com)
   - Crea un nuevo proyecto llamado "rosema-pos"
   - Habilita Authentication, Firestore y Storage

2. **Configurar Authentication**:
   - Ve a Authentication > Sign-in method
   - Habilita "Email/Password"
   - Crea el primer usuario administrador

3. **Configurar Firestore**:
   - Ve a Firestore Database
   - Crea la base de datos en modo producción
   - Las reglas se aplicarán automáticamente al hacer deploy

4. **Configurar Storage**:
   - Ve a Storage
   - Configura el bucket de almacenamiento
   - Las reglas se aplicarán automáticamente al hacer deploy

### Paso 3: Autenticación con Firebase CLI

```bash
# Iniciar sesión en Firebase
firebase login

# Verificar que el proyecto esté configurado
firebase projects:list
```

### Paso 4: Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev
```

El proyecto estará disponible en `http://localhost:8000`

### Paso 5: Crear Usuario Administrador

1. Ve a la página de login
2. Usa Firebase Console para crear el primer usuario:
   - Ve a Authentication > Users
   - Agrega un usuario con email y contraseña
   - Ve a Firestore Database
   - Crea una colección "users"
   - Agrega un documento con el UID del usuario:

```json
{
  "uid": "UID_DEL_USUARIO",
  "email": "admin@rosema.com",
  "name": "Administrador",
  "role": "administrador",
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## 🚀 Despliegue en Firebase Hosting

### Paso 1: Construir el Proyecto

```bash
# Generar build de producción
npm run build
```

### Paso 2: Desplegar

```bash
# Desplegar reglas de Firestore y Storage
firebase deploy --only firestore:rules,storage

# Desplegar la aplicación web
firebase deploy --only hosting

# O desplegar todo junto
firebase deploy
```

### Paso 3: Configurar Dominio (Opcional)

1. Ve a Firebase Console > Hosting
2. Agrega un dominio personalizado si lo deseas
3. Sigue las instrucciones para configurar DNS

## 🔧 Configuración Adicional

### Variables de Entorno

El proyecto usa la configuración de Firebase directamente en el código. Para mayor seguridad en producción, considera usar variables de entorno:

1. Crea un archivo `.env.local`:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

2. Actualiza `src/services/firebase.js` para usar las variables de entorno.

### Configuración de Reglas de Seguridad

Las reglas de Firestore y Storage están configuradas para:
- Solo usuarios autenticados pueden acceder a los datos
- Los administradores tienen acceso completo
- Los vendedores tienen acceso limitado según sus permisos
- Los archivos tienen límites de tamaño y tipo

### Índices de Firestore

Los índices están preconfigurados para optimizar las consultas más comunes:
- Ventas por fecha
- Productos por categoría
- Facturas por tipo y fecha
- Proveedores por área

## 📱 Uso del Sistema

### Para Administradores

1. **Gestión de Usuarios**: Crear y administrar vendedores
2. **Gestión de Productos**: CRUD completo de productos
3. **Gestión de Proveedores**: CRUD completo de proveedores
4. **Gestión de Facturas**: CRUD completo de facturas ARCA
5. **Estadísticas**: Acceso completo a reportes y métricas
6. **Ventas**: Realizar ventas y gestionar el proceso completo

### Para Vendedores

1. **Ventas**: Realizar ventas y gestionar carrito
2. **Productos**: Ver catálogo y stock
3. **Estadísticas**: Ver métricas básicas
4. **Perfil**: Gestionar información personal

## 🔒 Seguridad

- ✅ Autenticación obligatoria para acceder al sistema
- ✅ Roles y permisos granulares
- ✅ Reglas de seguridad en Firestore y Storage
- ✅ Validación de datos en frontend y backend
- ✅ Sanitización de inputs
- ✅ Límites de tamaño y tipo de archivos

## 🐛 Solución de Problemas

### Error de Permisos en Firestore

Si recibes errores de permisos:
1. Verifica que el usuario esté autenticado
2. Confirma que el documento del usuario existe en la colección "users"
3. Verifica que el campo "active" sea true
4. Para administradores, confirma que "role" sea "administrador"

### Error de Carga de Imágenes

Si las imágenes no se cargan:
1. Verifica las reglas de Storage
2. Confirma que los archivos sean del tipo correcto
3. Verifica el tamaño de los archivos (límites configurados)

### Error de Build

Si hay errores al hacer build:
1. Verifica que todas las dependencias estén instaladas
2. Confirma que no hay errores de TypeScript/JavaScript
3. Verifica la configuración de Vite

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema:

1. Revisa la documentación en este README
2. Verifica los logs de la consola del navegador
3. Consulta los logs de Firebase Console
4. Revisa las reglas de seguridad de Firestore y Storage

## 📄 Licencia

Este proyecto está desarrollado específicamente para Rosema y contiene configuraciones personalizadas para sus necesidades comerciales.

## 🎯 Próximas Mejoras

- [ ] Módulo de clientes con historial de compras
- [ ] Sistema de promociones y descuentos automáticos
- [ ] Integración con sistemas de facturación electrónica
- [ ] App móvil para vendedores
- [ ] Sistema de notificaciones push
- [ ] Reportes avanzados con gráficos interactivos
- [ ] Integración con redes sociales para marketing
- [ ] Sistema de fidelización de clientes

---

**Desarrollado con ❤️ para Rosema**
