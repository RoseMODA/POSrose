// Página de Proveedores para el sistema POS Rosema
// Gestión completa de proveedores con información detallada

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatPhone } from '../utils/format';
import { validateForm, sanitizeFormData } from '../utils/validations';
import LoadingSpinner from '../components/LoadingSpinner';

const Proveedores = () => {
  // Estados principales
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    whatsapp1: '',
    whatsapp2: '',
    whatsapp3: '',
    address: '',
    gallery: '',
    localNumber: '',
    area: '',
    tags: '',
    website: '',
    socialMedia: {
      instagram: '',
      facebook: '',
      twitter: ''
    },
    cuit: '',
    qualityRating: 5,
    notes: ''
  });
  
  // Estados de UI
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const { userProfile, hasPermission } = useAuth();

  // Cargar proveedores al montar el componente
  useEffect(() => {
    loadSuppliers();
  }, []);

  // Función para cargar proveedores
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const suppliersCollection = collection(db, 'suppliers');
      const suppliersSnapshot = await getDocs(suppliersCollection);
      const suppliersData = suppliersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
      setError('Error al cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar proveedores
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.tags?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.cuit?.includes(searchTerm)
  );

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('socialMedia.')) {
      const socialField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar error específico del campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validar formulario
  const validateSupplierForm = () => {
    const rules = {
      name: { required: true, minLength: 2 },
      area: { required: true },
      whatsapp1: { phone: true }
    };

    // Validar CUIT si se proporciona
    if (formData.cuit.trim()) {
      rules.cuit = { cuit: true };
    }

    const validation = validateForm(formData, rules);
    
    // Validaciones adicionales
    if (validation.isValid) {
      // Verificar nombre único (solo para proveedores nuevos o si cambió el nombre)
      const existingSupplier = suppliers.find(s => 
        s.name.toLowerCase() === formData.name.toLowerCase() && 
        s.id !== editingSupplier?.id
      );
      
      if (existingSupplier) {
        validation.isValid = false;
        validation.errors.name = 'Ya existe un proveedor con este nombre';
      }
    }

    setFormErrors(validation.errors);
    return validation.isValid;
  };

  // Abrir modal para nuevo proveedor
  const openNewSupplierModal = () => {
    if (!hasPermission('create_supplier')) {
      setError('No tienes permisos para crear proveedores');
      return;
    }
    
    setEditingSupplier(null);
    setFormData({
      name: '',
      whatsapp1: '',
      whatsapp2: '',
      whatsapp3: '',
      address: '',
      gallery: '',
      localNumber: '',
      area: '',
      tags: '',
      website: '',
      socialMedia: {
        instagram: '',
        facebook: '',
        twitter: ''
      },
      cuit: '',
      qualityRating: 5,
      notes: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Abrir modal para editar proveedor
  const openEditSupplierModal = (supplier) => {
    if (!hasPermission('edit_supplier')) {
      setError('No tienes permisos para editar proveedores');
      return;
    }
    
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      whatsapp1: supplier.whatsapp1 || '',
      whatsapp2: supplier.whatsapp2 || '',
      whatsapp3: supplier.whatsapp3 || '',
      address: supplier.address || '',
      gallery: supplier.gallery || '',
      localNumber: supplier.localNumber || '',
      area: supplier.area || '',
      tags: supplier.tags || '',
      website: supplier.website || '',
      socialMedia: {
        instagram: supplier.socialMedia?.instagram || '',
        facebook: supplier.socialMedia?.facebook || '',
        twitter: supplier.socialMedia?.twitter || ''
      },
      cuit: supplier.cuit || '',
      qualityRating: supplier.qualityRating || 5,
      notes: supplier.notes || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setFormErrors({});
  };

  // Guardar proveedor
  const saveSupplier = async () => {
    if (!validateSupplierForm()) {
      return;
    }

    setSaving(true);
    try {
      // Sanitizar datos
      const sanitizedData = sanitizeFormData(formData, [
        'name', 'address', 'gallery', 'area', 'tags', 'website', 'notes'
      ]);

      // Preparar datos del proveedor
      const supplierData = {
        ...sanitizedData,
        qualityRating: parseInt(sanitizedData.qualityRating),
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile.uid
      };

      if (editingSupplier) {
        // Actualizar proveedor existente
        const supplierRef = doc(db, 'suppliers', editingSupplier.id);
        await updateDoc(supplierRef, supplierData);
        setSuccess('Proveedor actualizado exitosamente');
      } else {
        // Crear nuevo proveedor
        supplierData.createdAt = new Date().toISOString();
        supplierData.createdBy = userProfile.uid;
        
        const suppliersCollection = collection(db, 'suppliers');
        await addDoc(suppliersCollection, supplierData);
        setSuccess('Proveedor creado exitosamente');
      }

      // Recargar proveedores
      await loadSuppliers();
      closeModal();

    } catch (error) {
      console.error('Error guardando proveedor:', error);
      setError('Error al guardar el proveedor');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar proveedor
  const deleteSupplier = async (supplier) => {
    if (!hasPermission('delete_supplier')) {
      setError('No tienes permisos para eliminar proveedores');
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar el proveedor "${supplier.name}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'suppliers', supplier.id));
      setSuccess('Proveedor eliminado exitosamente');
      await loadSuppliers();
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      setError('Error al eliminar el proveedor');
    }
  };

  // Renderizar estrellas de calificación
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-lg ${
          index < rating ? 'text-yellow-400' : 'text-rosema-gray-300'
        }`}
      >
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" text="Cargando proveedores..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-rosema-dark">Gestión de Proveedores</h1>
        <button
          onClick={openNewSupplierModal}
          className="btn-primary"
          disabled={!hasPermission('create_supplier')}
        >
          Nuevo Proveedor
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-sm mt-2"
          >
            Cerrar
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600">{success}</p>
          <button 
            onClick={() => setSuccess(null)}
            className="text-green-500 hover:text-green-700 text-sm mt-2"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Búsqueda */}
      <div className="card">
        <div>
          <label className="form-label">Buscar proveedores</label>
          <input
            type="text"
            placeholder="Nombre, área, tags o CUIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Lista de proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full">
            <div className="card text-center py-12">
              <p className="text-rosema-gray-500 text-lg">
                No se encontraron proveedores
              </p>
            </div>
          </div>
        ) : (
          filteredSuppliers.map(supplier => (
            <div key={supplier.id} className="card hover:shadow-lg transition-shadow">
              {/* Header de la tarjeta */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-rosema-dark mb-1">
                    {supplier.name}
                  </h3>
                  <p className="text-sm text-rosema-gray-600">
                    {supplier.area}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditSupplierModal(supplier)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    disabled={!hasPermission('edit_supplier')}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteSupplier(supplier)}
                    className="text-red-600 hover:text-red-800 text-sm"
                    disabled={!hasPermission('delete_supplier')}
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="space-y-2 mb-4">
                {supplier.whatsapp1 && (
                  <div className="flex items-center text-sm">
                    <span className="text-rosema-gray-500 w-20">WhatsApp:</span>
                    <a
                      href={`https://wa.me/${supplier.whatsapp1.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800"
                    >
                      {formatPhone(supplier.whatsapp1)}
                    </a>
                  </div>
                )}
                
                {supplier.address && (
                  <div className="flex items-start text-sm">
                    <span className="text-rosema-gray-500 w-20">Dirección:</span>
                    <span className="text-rosema-dark">{supplier.address}</span>
                  </div>
                )}

                {supplier.gallery && (
                  <div className="flex items-center text-sm">
                    <span className="text-rosema-gray-500 w-20">Galería:</span>
                    <span className="text-rosema-dark">
                      {supplier.gallery}
                      {supplier.localNumber && ` - Local ${supplier.localNumber}`}
                    </span>
                  </div>
                )}

                {supplier.website && (
                  <div className="flex items-center text-sm">
                    <span className="text-rosema-gray-500 w-20">Web:</span>
                    <a
                      href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 truncate"
                    >
                      {supplier.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Tags */}
              {supplier.tags && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {supplier.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-rosema-gray-100 text-rosema-gray-700 text-xs rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Calificación */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-rosema-gray-500 mr-2">Calidad:</span>
                  <div className="flex">
                    {renderStars(supplier.qualityRating)}
                  </div>
                </div>
                
                {supplier.cuit && (
                  <span className="text-xs text-rosema-gray-500 font-mono">
                    CUIT: {supplier.cuit}
                  </span>
                )}
              </div>

              {/* Redes sociales */}
              {(supplier.socialMedia?.instagram || supplier.socialMedia?.facebook) && (
                <div className="mt-4 pt-4 border-t border-rosema-gray-200">
                  <div className="flex space-x-3">
                    {supplier.socialMedia.instagram && (
                      <a
                        href={`https://instagram.com/${supplier.socialMedia.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-800 text-sm"
                      >
                        Instagram
                      </a>
                    )}
                    {supplier.socialMedia.facebook && (
                      <a
                        href={`https://facebook.com/${supplier.socialMedia.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Facebook
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Notas */}
              {supplier.notes && (
                <div className="mt-4 pt-4 border-t border-rosema-gray-200">
                  <p className="text-sm text-rosema-gray-600 italic">
                    "{supplier.notes}"
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de proveedor */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-rosema-dark">
                  {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-rosema-gray-400 hover:text-rosema-gray-600"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`form-input ${formErrors.name ? 'form-error' : ''}`}
                      placeholder="Nombre del proveedor"
                    />
                    {formErrors.name && (
                      <p className="error-message">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Área *</label>
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      className={`form-input ${formErrors.area ? 'form-error' : ''}`}
                      placeholder="Ej: Microcentro, Once, Flores"
                    />
                    {formErrors.area && (
                      <p className="error-message">{formErrors.area}</p>
                    )}
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">WhatsApp 1</label>
                    <input
                      type="tel"
                      name="whatsapp1"
                      value={formData.whatsapp1}
                      onChange={handleInputChange}
                      className={`form-input ${formErrors.whatsapp1 ? 'form-error' : ''}`}
                      placeholder="11 2345-6789"
                    />
                    {formErrors.whatsapp1 && (
                      <p className="error-message">{formErrors.whatsapp1}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">WhatsApp 2</label>
                    <input
                      type="tel"
                      name="whatsapp2"
                      value={formData.whatsapp2}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="11 2345-6789"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">WhatsApp 3</label>
                    <input
                      type="tel"
                      name="whatsapp3"
                      value={formData.whatsapp3}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="11 2345-6789"
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Dirección completa"
                  />
                </div>

                {/* Galería y Local */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Galería</label>
                    <input
                      type="text"
                      name="gallery"
                      value={formData.gallery}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Nombre de la galería"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Número de Local</label>
                    <input
                      type="text"
                      name="localNumber"
                      value={formData.localNumber}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Ej: 123, A-15"
                    />
                  </div>
                </div>

                {/* Tags y Website */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Tags</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="jeans, mujer, fabricante, mayorista"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sitio Web</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="https://ejemplo.com"
                    />
                  </div>
                </div>

                {/* Redes sociales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Instagram</label>
                    <input
                      type="text"
                      name="socialMedia.instagram"
                      value={formData.socialMedia.instagram}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="usuario_instagram"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Facebook</label>
                    <input
                      type="text"
                      name="socialMedia.facebook"
                      value={formData.socialMedia.facebook}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="pagina.facebook"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Twitter</label>
                    <input
                      type="text"
                      name="socialMedia.twitter"
                      value={formData.socialMedia.twitter}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="@usuario_twitter"
                    />
                  </div>
                </div>

                {/* CUIT y Calificación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">CUIT</label>
                    <input
                      type="text"
                      name="cuit"
                      value={formData.cuit}
                      onChange={handleInputChange}
                      className={`form-input ${formErrors.cuit ? 'form-error' : ''}`}
                      placeholder="20-12345678-9"
                    />
                    {formErrors.cuit && (
                      <p className="error-message">{formErrors.cuit}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ranking de Calidad</label>
                    <select
                      name="qualityRating"
                      value={formData.qualityRating}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value={1}>1 - Muy Malo</option>
                      <option value={2}>2 - Malo</option>
                      <option value={3}>3 - Regular</option>
                      <option value={4}>4 - Bueno</option>
                      <option value={5}>5 - Excelente</option>
                    </select>
                  </div>
                </div>

                {/* Notas */}
                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="form-input"
                    rows="3"
                    placeholder="Notas adicionales sobre el proveedor"
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-rosema-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={saveSupplier}
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="flex items-center">
                        <LoadingSpinner size="small" color="white" />
                        <span className="ml-2">Guardando...</span>
                      </div>
                    ) : (
                      editingSupplier ? 'Actualizar' : 'Crear'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proveedores;
