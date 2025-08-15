// Componente Dashboard principal para el sistema POS Rosema
// Contiene la estructura general con sidebar, navbar y área de contenido

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  // Estado para controlar la visibilidad del sidebar en móviles
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Función para alternar el sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Función para cerrar el sidebar (útil en móviles)
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-rosema-gray-100">
      {/* Navbar superior */}
      <Navbar onToggleSidebar={toggleSidebar} />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar}
        />
        
        {/* Overlay para móviles cuando el sidebar está abierto */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={closeSidebar}
          />
        )}
        
        {/* Área de contenido principal */}
        <main className="flex-1 lg:ml-64 transition-all duration-300">
          <div className="p-6">
            {/* 
              Outlet renderiza los componentes de las rutas anidadas
              (Inicio, Ventas, Productos, etc.)
            */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
