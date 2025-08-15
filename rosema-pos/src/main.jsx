// Punto de entrada principal de la aplicación POS Rosema
// Este archivo inicializa React y configura el enrutamiento principal

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Importar el contexto de autenticación
import { AuthProvider } from './contexts/AuthContext.jsx'

/*
  Estructura de la aplicación:
  1. BrowserRouter: Maneja el enrutamiento de la aplicación
  2. AuthProvider: Proporciona el contexto de autenticación a toda la app
  3. App: Componente principal que contiene toda la lógica de rutas
*/

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
