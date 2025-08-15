// Contexto de autenticación para el sistema POS Rosema
// Maneja el estado de autenticación de usuarios (administradores y vendedores)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// Crear el contexto de autenticación
const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Proveedor del contexto de autenticación
export const AuthProvider = ({ children }) => {
  // Estados del contexto
  const [currentUser, setCurrentUser] = useState(null); // Usuario actual autenticado
  const [userProfile, setUserProfile] = useState(null); // Perfil del usuario con datos adicionales
  const [loading, setLoading] = useState(true); // Estado de carga inicial
  const [error, setError] = useState(null); // Errores de autenticación

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      // Autenticar con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Obtener el perfil del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const profile = userDoc.data();
        setUserProfile(profile);
        
        // Verificar que el usuario esté activo
        if (!profile.active) {
          await signOut(auth);
          throw new Error('Usuario desactivado. Contacte al administrador.');
        }
        
        return { success: true, user: profile };
      } else {
        // Si no existe el perfil, crear uno básico
        const basicProfile = {
          uid: user.uid,
          email: user.email,
          name: user.email.split('@')[0],
          role: 'vendedor', // Por defecto es vendedor
          active: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', user.uid), basicProfile);
        setUserProfile(basicProfile);
        
        return { success: true, user: basicProfile };
      }
    } catch (error) {
      console.error('Error en login:', error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al iniciar sesión';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuario no encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Intente más tarde.';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      setError('Error al cerrar sesión');
      return { success: false, error: 'Error al cerrar sesión' };
    }
  };

  // Función para registrar un nuevo usuario (solo administradores)
  const register = async (userData) => {
    try {
      setError(null);
      
      // Verificar que el usuario actual sea administrador
      if (!userProfile || userProfile.role !== 'administrador') {
        throw new Error('Solo los administradores pueden crear nuevos usuarios');
      }
      
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;
      
      // Crear perfil en Firestore
      const newUserProfile = {
        uid: user.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'vendedor',
        active: true,
        createdAt: new Date().toISOString(),
        createdBy: userProfile.uid
      };
      
      await setDoc(doc(db, 'users', user.uid), newUserProfile);
      
      return { success: true, user: newUserProfile };
    } catch (error) {
      console.error('Error en registro:', error);
      
      let errorMessage = 'Error al registrar usuario';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'El email ya está en uso';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Función para actualizar el perfil del usuario
  const updateProfile = async (updates) => {
    try {
      if (!currentUser) throw new Error('No hay usuario autenticado');
      
      const updatedProfile = {
        ...userProfile,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', currentUser.uid), updatedProfile, { merge: true });
      setUserProfile(updatedProfile);
      
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setError('Error al actualizar perfil');
      return { success: false, error: 'Error al actualizar perfil' };
    }
  };

  // Función para verificar si el usuario tiene permisos de administrador
  const isAdmin = () => {
    return userProfile && userProfile.role === 'administrador';
  };

  // Función para verificar si el usuario puede realizar una acción específica
  const hasPermission = (action) => {
    if (!userProfile) return false;
    
    // Los administradores pueden hacer todo
    if (userProfile.role === 'administrador') return true;
    
    // Definir permisos por rol
    const permissions = {
      vendedor: [
        'view_products',
        'create_sale',
        'view_sales',
        'view_customers',
        'create_customer'
      ],
      administrador: ['*'] // Todos los permisos
    };
    
    const userPermissions = permissions[userProfile.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(action);
  };

  // Efecto para escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          
          // Obtener perfil del usuario
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const profile = userDoc.data();
            setUserProfile(profile);
            
            // Actualizar último login
            await setDoc(doc(db, 'users', user.uid), {
              lastLogin: new Date().toISOString()
            }, { merge: true });
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error en onAuthStateChanged:', error);
        setError('Error al verificar autenticación');
      } finally {
        setLoading(false);
      }
    });

    // Cleanup function
    return unsubscribe;
  }, []);

  // Valor del contexto que se proporciona a los componentes hijos
  const value = {
    // Estados
    currentUser,
    userProfile,
    loading,
    error,
    
    // Funciones
    login,
    logout,
    register,
    updateProfile,
    isAdmin,
    hasPermission,
    
    // Función para limpiar errores
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
