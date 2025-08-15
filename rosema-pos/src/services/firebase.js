// Configuración e inicialización de Firebase para el sistema POS Rosema
// Este archivo maneja la conexión con Firebase Authentication, Firestore y Storage

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Configuración de Firebase proporcionada por el usuario
const firebaseConfig = {
  apiKey: "AIzaSyAMbdKhLxdzaigZW95MC9G0hPGR4r-b5d0",
  authDomain: "rosema-pos.firebaseapp.com",
  projectId: "rosema-pos",
  storageBucket: "rosema-pos.firebasestorage.app",
  messagingSenderId: "1097595627472",
  appId: "1:1097595627472:web:18e4f622b01b4ec8643bd5",
  measurementId: "G-D7RDWF848P"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios de Firebase
// Auth: Para autenticación de usuarios (administradores y vendedores)
export const auth = getAuth(app);

// Firestore: Base de datos para almacenar productos, ventas, proveedores, etc.
export const db = getFirestore(app);

// Storage: Para almacenar imágenes de productos y archivos de facturas ARCA
export const storage = getStorage(app);

// Analytics: Para seguimiento de uso (opcional)
export const analytics = getAnalytics(app);

// Exportar la app inicializada por si se necesita en otros lugares
export default app;

/*
  Estructura de colecciones en Firestore:
  
  - users: Información de usuarios (administradores y vendedores)
  - products: Catálogo de productos con stock, precios, etc.
  - sales: Registro de todas las ventas realizadas
  - suppliers: Información de proveedores
  - invoices: Facturas ARCA con referencias a archivos en Storage
  - customers: Información de clientes (opcional)
  - categories: Categorías de productos
  - settings: Configuraciones del sistema
*/
