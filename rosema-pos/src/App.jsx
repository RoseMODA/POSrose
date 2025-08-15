// Componente principal de la aplicación POS Rosema
// Maneja el enrutamiento y la estructura general de la aplicación

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Importar componentes de páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ventas from './pages/Ventas';
import Productos from './pages/Productos';
import Proveedores from './pages/Proveedores';
import Facturas from './pages/Facturas';
import Estadisticas from './pages/Estadisticas';

// Importar componentes comunes
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { loading } = useAuth();

  // Mostrar spinner de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-rosema-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-rosema-gray-600">Cargando Rosema POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Ruta pública - Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas - Requieren autenticación */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }>
          {/* Rutas anidadas dentro del Dashboard */}
          <Route index element={<Navigate to="/inicio" replace />} />
          <Route path="inicio" element={<DashboardHome />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="productos" element={<Productos />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="facturas" element={<Facturas />} />
          <Route path="estadisticas" element={<Estadisticas />} />
        </Route>
        
        {/* Ruta por defecto - Redirigir al dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

// Componente para la página de inicio del dashboard
const DashboardHome = () => {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      {/* Encabezado de bienvenida */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-rosema-dark mb-2">
          ¡Bienvenido a Rosema POS!
        </h1>
        <p className="text-rosema-gray-600">
          Hola {userProfile?.name || 'Usuario'}, 
          {userProfile?.role === 'administrador' ? ' tienes acceso completo al sistema.' : ' puedes gestionar ventas y productos.'}
        </p>
      </div>

      {/* Tarjetas de resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickStatsCard
          title="Ventas Hoy"
          value="$0"
          description="0 transacciones"
          color="bg-green-500"
        />
        <QuickStatsCard
          title="Productos"
          value="0"
          description="En inventario"
          color="bg-blue-500"
        />
        <QuickStatsCard
          title="Stock Bajo"
          value="0"
          description="Productos"
          color="bg-yellow-500"
        />
        <QuickStatsCard
          title="Proveedores"
          value="0"
          description="Registrados"
          color="bg-purple-500"
        />
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-rosema-dark mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionButton
            title="Nueva Venta"
            description="Iniciar una nueva transacción"
            href="/ventas"
            color="bg-rosema-red"
          />
          <QuickActionButton
            title="Agregar Producto"
            description="Añadir producto al inventario"
            href="/productos"
            color="bg-green-600"
          />
          <QuickActionButton
            title="Ver Estadísticas"
            description="Revisar reportes y métricas"
            href="/estadisticas"
            color="bg-blue-600"
          />
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-rosema-dark mb-4">
          Actividad Reciente
        </h2>
        <div className="text-center py-8 text-rosema-gray-500">
          <p>No hay actividad reciente para mostrar.</p>
          <p className="text-sm mt-2">Las ventas y cambios aparecerán aquí.</p>
        </div>
      </div>
    </div>
  );
};

// Componente para tarjetas de estadísticas rápidas
const QuickStatsCard = ({ title, value, description, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`${color} rounded-full p-3 mr-4`}>
          <div className="w-6 h-6 bg-white rounded-full opacity-30"></div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-rosema-dark">{value}</h3>
          <p className="text-sm text-rosema-gray-600">{title}</p>
          <p className="text-xs text-rosema-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Componente para botones de acciones rápidas
const QuickActionButton = ({ title, description, href, color }) => {
  return (
    <a
      href={href}
      className={`${color} text-white rounded-lg p-4 block hover:opacity-90 transition-opacity`}
    >
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </a>
  );
};

export default App;
