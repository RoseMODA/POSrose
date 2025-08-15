// Componente Navbar para el sistema POS Rosema
// Barra de navegación superior con información del usuario y controles

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime } from '../utils/format';

const Navbar = ({ onToggleSidebar }) => {
  const { userProfile, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoggingOut(false);
      setShowUserMenu(false);
    }
  };

  // Obtener las iniciales del usuario para el avatar
  const getUserInitials = () => {
    if (!userProfile?.name) return 'U';
    return userProfile.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="bg-white shadow-md border-b border-rosema-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Lado izquierdo - Logo y botón de menú */}
          <div className="flex items-center">
            {/* Botón de menú para móviles */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-md text-rosema-gray-600 hover:text-rosema-dark hover:bg-rosema-gray-100 focus:outline-none focus:ring-2 focus:ring-rosema-red"
              aria-label="Abrir menú"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo y título */}
            <div className="flex items-center ml-2 lg:ml-0">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-rosema-red">
                  Rosema POS
                </h1>
              </div>
              <div className="hidden sm:block ml-4">
                <p className="text-sm text-rosema-gray-600">
                  Sistema de Punto de Venta
                </p>
              </div>
            </div>
          </div>

          {/* Centro - Información de fecha/hora actual */}
          <div className="hidden md:flex items-center">
            <div className="text-center">
              <p className="text-sm font-medium text-rosema-dark">
                {formatDateTime(new Date())}
              </p>
              <p className="text-xs text-rosema-gray-500">
                Fecha y hora actual
              </p>
            </div>
          </div>

          {/* Lado derecho - Información del usuario */}
          <div className="flex items-center space-x-4">
            {/* Información del usuario */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-rosema-dark">
                {userProfile?.name || 'Usuario'}
              </p>
              <p className="text-xs text-rosema-gray-500 capitalize">
                {userProfile?.role || 'Sin rol'}
              </p>
            </div>

            {/* Avatar y menú desplegable */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center p-2 rounded-full bg-rosema-red text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-rosema-red focus:ring-offset-2"
                aria-label="Menú de usuario"
              >
                <span className="text-sm font-semibold">
                  {getUserInitials()}
                </span>
              </button>

              {/* Menú desplegable */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-rosema-gray-200">
                  {/* Información del usuario en el menú */}
                  <div className="px-4 py-2 border-b border-rosema-gray-200">
                    <p className="text-sm font-medium text-rosema-dark">
                      {userProfile?.name || 'Usuario'}
                    </p>
                    <p className="text-xs text-rosema-gray-500">
                      {userProfile?.email}
                    </p>
                    <p className="text-xs text-rosema-gray-500 capitalize">
                      {userProfile?.role || 'Sin rol'}
                    </p>
                  </div>

                  {/* Opciones del menú */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Aquí podrías agregar lógica para mostrar perfil
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-rosema-gray-700 hover:bg-rosema-gray-100"
                  >
                    Ver Perfil
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Aquí podrías agregar lógica para configuraciones
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-rosema-gray-700 hover:bg-rosema-gray-100"
                  >
                    Configuración
                  </button>

                  <div className="border-t border-rosema-gray-200 my-1"></div>

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay para cerrar el menú cuando se hace clic fuera */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
