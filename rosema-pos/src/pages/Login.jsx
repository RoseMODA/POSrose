// Página de inicio de sesión para el sistema POS Rosema
// Permite a administradores y vendedores autenticarse en el sistema

import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  // Estados del componente
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Hooks de autenticación y navegación
  const { login, currentUser, error, clearError } = useAuth();
  const location = useLocation();

  // Obtener la ruta desde donde vino el usuario (para redirigir después del login)
  const from = location.state?.from?.pathname || '/';

  // Si ya está autenticado, redirigir al dashboard
  if (currentUser) {
    return <Navigate to={from} replace />;
  }

  // Limpiar errores cuando el componente se monta
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Manejar cambios en los inputs del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) {
      clearError();
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.email.trim()) {
      return;
    }
    
    if (!formData.password) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(formData.email.trim(), formData.password);
      
      if (result.success) {
        // El redireccionamiento se maneja automáticamente por el Navigate arriba
        console.log('Login exitoso');
      }
    } catch (err) {
      console.error('Error en login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #d63629, #b91c1c)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '28rem',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          borderBottom: '1px solid #e5e5e5'
        }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#222222',
            marginBottom: '0.5rem',
            fontFamily: 'Inter, sans-serif'
          }}>
            Rosema POS
          </h1>
          <p style={{
            color: '#737373',
            fontFamily: 'Inter, sans-serif'
          }}>
            Sistema de Punto de Venta
          </p>
        </div>

        {/* Formulario de login */}
        <div style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Campo de email */}
            <div>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#222222',
                marginBottom: '0.5rem',
                fontFamily: 'Inter, sans-serif'
              }}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  border: error ? '1px solid #dc2626' : '1px solid #d4d4d4',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                autoFocus
                onFocus={(e) => {
                  e.target.style.borderColor = '#d63629';
                  e.target.style.boxShadow = '0 0 0 3px rgba(214, 54, 41, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = error ? '#dc2626' : '#d4d4d4';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Campo de contraseña */}
            <div>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#222222',
                marginBottom: '0.5rem',
                fontFamily: 'Inter, sans-serif'
              }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    border: error ? '1px solid #dc2626' : '1px solid #d4d4d4',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    paddingRight: '2.5rem',
                    fontSize: '1rem',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#d63629';
                    e.target.style.boxShadow = '0 0 0 3px rgba(214, 54, 41, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error ? '#dc2626' : '#d4d4d4';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#a3a3a3',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Mostrar errores */}
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '0.75rem'
              }}>
                <p style={{
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  margin: '0',
                  fontFamily: 'Inter, sans-serif'
                }}>{error}</p>
              </div>
            )}

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isLoading || !formData.email.trim() || !formData.password}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                opacity: (isLoading || !formData.email.trim() || !formData.password) ? '0.5' : '1',
                cursor: (isLoading || !formData.email.trim() || !formData.password) ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LoadingSpinner size="small" color="white" />
                  <span style={{ marginLeft: '0.5rem' }}>Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Información adicional */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e5e5'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#737373',
                marginBottom: '0.5rem',
                fontFamily: 'Inter, sans-serif'
              }}>
                ¿Problemas para acceder?
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: '#a3a3a3',
                fontFamily: 'Inter, sans-serif'
              }}>
                Contacta al administrador del sistema
              </p>
            </div>
          </div>

          {/* Información de roles */}
          <div style={{
            marginTop: '1.5rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#222222',
              marginBottom: '0.5rem',
              fontFamily: 'Inter, sans-serif'
            }}>
              Tipos de Usuario:
            </h3>
            <ul style={{
              fontSize: '0.75rem',
              color: '#737373',
              lineHeight: '1.5',
              margin: '0',
              paddingLeft: '0',
              listStyle: 'none',
              fontFamily: 'Inter, sans-serif'
            }}>
              <li style={{ marginBottom: '0.25rem' }}>• <strong>Administrador:</strong> Acceso completo al sistema</li>
              <li>• <strong>Vendedor:</strong> Gestión de ventas y productos</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 2rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '0 0 0.5rem 0.5rem'
        }}>
          <p style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#a3a3a3',
            margin: '0',
            fontFamily: 'Inter, sans-serif'
          }}>
            © 2024 Rosema. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
