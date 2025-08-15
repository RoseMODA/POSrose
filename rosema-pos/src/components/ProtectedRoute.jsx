// Componente de ruta protegida para el sistema POS Rosema
// Verifica la autenticación antes de permitir acceso a rutas privadas

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Componente ProtectedRoute
 * Protege rutas que requieren autenticación
 * 
 * @param {React.ReactNode} children - Componentes hijos a renderizar si está autenticado
 * @param {string} requiredRole - Rol requerido para acceder (opcional)
 * @param {string} requiredPermission - Permiso específico requerido (opcional)
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredPermission = null 
}) => {
  const { currentUser, userProfile, loading, hasPermission } = useAuth();
  const location = useLocation();

  // Mostrar spinner mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-rosema-gray-100 flex items-center justify-center">
        <LoadingSpinner size="large" text="Verificando autenticación..." />
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!currentUser) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Si se requiere un rol específico y el usuario no lo tiene
  if (requiredRole && userProfile?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-rosema-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-rosema-dark mb-2">
            Acceso Denegado
          </h2>
          <p className="text-rosema-gray-600 mb-4">
            No tienes permisos para acceder a esta sección.
          </p>
          <p className="text-sm text-rosema-gray-500">
            Rol requerido: <span className="font-semibold">{requiredRole}</span>
          </p>
          <p className="text-sm text-rosema-gray-500">
            Tu rol: <span className="font-semibold">{userProfile?.role || 'Sin rol'}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 btn-secondary"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Si se requiere un permiso específico y el usuario no lo tiene
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen bg-rosema-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-yellow-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-rosema-dark mb-2">
            Permisos Insuficientes
          </h2>
          <p className="text-rosema-gray-600 mb-4">
            No tienes los permisos necesarios para realizar esta acción.
          </p>
          <p className="text-sm text-rosema-gray-500">
            Permiso requerido: <span className="font-semibold">{requiredPermission}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 btn-secondary"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Si el usuario está inactivo
  if (userProfile && !userProfile.active) {
    return (
      <div className="min-h-screen bg-rosema-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-gray-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-rosema-dark mb-2">
            Usuario Desactivado
          </h2>
          <p className="text-rosema-gray-600 mb-4">
            Tu cuenta ha sido desactivada. Contacta al administrador para más información.
          </p>
          <button
            onClick={() => {
              // Aquí podrías agregar lógica para cerrar sesión automáticamente
              window.location.href = '/login';
            }}
            className="mt-4 btn-primary"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  // Si todas las verificaciones pasan, renderizar los componentes hijos
  return children;
};

export default ProtectedRoute;
