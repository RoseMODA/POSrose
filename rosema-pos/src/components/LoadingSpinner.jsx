// Componente de spinner de carga para el sistema POS Rosema
// Proporciona feedback visual durante operaciones asíncronas

import React from 'react';

/**
 * Componente LoadingSpinner
 * @param {string} size - Tamaño del spinner: 'small', 'medium', 'large'
 * @param {string} color - Color del spinner: 'primary', 'white', 'gray'
 * @param {string} text - Texto opcional a mostrar debajo del spinner
 */
const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = null 
}) => {
  // Definir clases CSS según el tamaño
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  // Definir clases CSS según el color
  const colorClasses = {
    primary: 'border-rosema-red',
    white: 'border-white',
    gray: 'border-rosema-gray-400'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Spinner animado */}
      <div
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]}
          animate-spin 
          rounded-full 
          border-2 
          border-t-transparent
        `}
        role="status"
        aria-label="Cargando"
      >
        <span className="sr-only">Cargando...</span>
      </div>
      
      {/* Texto opcional */}
      {text && (
        <p className="mt-2 text-sm text-rosema-gray-600">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
