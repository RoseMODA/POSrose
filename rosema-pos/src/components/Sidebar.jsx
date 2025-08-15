// Componente Sidebar para el sistema POS Rosema
// Menú lateral de navegación con enlaces a todas las secciones

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { userProfile, hasPermission } = useAuth();
  const location = useLocation();

  // Definir los elementos del menú con sus permisos
  const menuItems = [
    {
      name: 'Inicio',
      path: '/inicio',
      permission: null, // Todos pueden ver el inicio
      description: 'Panel principal'
    },
    {
      name: 'Ventas',
      path: '/ventas',
      permission: 'create_sale',
      description: 'Gestionar ventas'
    },
    {
      name: 'Productos',
      path: '/productos',
      permission: 'view_products',
      description: 'Inventario y catálogo'
    },
    {
      name: 'Proveedores',
      path: '/proveedores',
      permission: 'view_suppliers',
      description: 'Gestión de proveedores'
    },
    {
      name: 'Facturas ARCA',
      path: '/facturas',
      permission: 'view_invoices',
      description: 'Documentos fiscales'
    },
    {
      name: 'Estadísticas',
      path: '/estadisticas',
      permission: 'view_statistics',
      description: 'Reportes y métricas'
    }
  ];

  // Filtrar elementos del menú según permisos
  const visibleMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  // Función para determinar si un enlace está activo
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-white shadow-lg border-r border-rosema-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header del sidebar */}
          <div className="p-4 border-b border-rosema-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-rosema-dark">
                  Menú Principal
                </h2>
                <p className="text-sm text-rosema-gray-600">
                  {userProfile?.name || 'Usuario'}
                </p>
              </div>
              
              {/* Botón para cerrar en móviles */}
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded-md text-rosema-gray-400 hover:text-rosema-dark hover:bg-rosema-gray-100"
                aria-label="Cerrar menú"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {visibleMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose} // Cerrar sidebar en móviles al hacer clic
                className={({ isActive }) => `
                  flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                  ${isActive || isActiveLink(item.path)
                    ? 'bg-rosema-red text-white shadow-md'
                    : 'text-rosema-gray-700 hover:bg-rosema-gray-100 hover:text-rosema-dark'
                  }
                `}
              >
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className={`text-xs mt-1 ${
                    isActiveLink(item.path) 
                      ? 'text-red-100' 
                      : 'text-rosema-gray-500'
                  }`}>
                    {item.description}
                  </div>
                </div>
                
                {/* Indicador visual para el elemento activo */}
                {isActiveLink(item.path) && (
                  <div className="w-2 h-2 bg-white rounded-full ml-2"></div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer del sidebar */}
          <div className="p-4 border-t border-rosema-gray-200">
            {/* Información del usuario */}
            <div className="bg-rosema-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-rosema-red rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-rosema-dark truncate">
                    {userProfile?.name || 'Usuario'}
                  </p>
                  <p className="text-xs text-rosema-gray-500 capitalize">
                    {userProfile?.role || 'Sin rol'}
                  </p>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-3 text-center">
              <p className="text-xs text-rosema-gray-500">
                Rosema POS v1.0
              </p>
              <p className="text-xs text-rosema-gray-400">
                © 2024 Rosema
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
