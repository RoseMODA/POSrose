// Página de Facturas ARCA para el sistema POS Rosema
// Gestión de facturas con carga de archivos PDF e imágenes

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime } from '../utils/format';
import { validateFile } from '../utils/validations';
import LoadingSpinner from '../components/LoadingSpinner';

const Facturas = () => {
  // Estados principales
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierName: '',
    amount: '',
    date: '',
    type: 'factura', // factura, nota_credito, nota_debito
    description: '',
    file: null
  });
  
  // Estados de UI
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const { userProfile, hasPermission } = useAuth();

  // Cargar facturas al montar el componente
  useEffect(() => {
    loadInvoices();
  }, []);

  // Función para cargar facturas
  const loadInvoices = async () => {
    try {
      setLoading(true);
      const invoicesCollection = collection(db, 'invoices');
      const invoicesQuery = query(invoicesCollection, orderBy('date', 'desc'));
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoicesData = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error cargando facturas:', error);
      setError('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar facturas
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || invoice.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error específico del campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Manejar carga de archivo
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const validation = validateFile(file, allowedTypes, 10); // 10MB máximo

    if (!validation.isValid) {
      setError(validation.error);
      e.target.value = ''; // Limpiar input
      return;
    }

    setFormData(prev => ({
      ...prev,
      file: file
    }));
    setError(null);
  };

  // Validar formulario
  const validateInvoiceForm = () => {
    const errors = {};
    
    if (!formData.invoiceNumber.trim()) {
      errors.invoiceNumber = 'El número de factura es requerido';
    }
    
    if (!formData.supplierName.trim()) {
      errors.supplierName = 'El nombre del proveedor es requerido';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'El monto debe ser mayor a cero';
    }
    
    if (!formData.date) {
      errors.date = 'La fecha es requerida';
    }
    
    if (!editingInvoice && !formData.file) {
      errors.file = 'Debe seleccionar un archivo';
    }

    // Verificar número de factura único (solo para facturas nuevas o si cambió el número)
    const existingInvoice = invoices.find(inv => 
      inv.invoiceNumber === formData.invoiceNumber && 
      inv.id !== editingInvoice?.id
    );
    
    if (existingInvoice) {
      errors.invoiceNumber = 'Ya existe una factura con este número';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Abrir modal para nueva factura
  const openNewInvoiceModal = () => {
    if (!hasPermission('create_invoice')) {
      setError('No tienes permisos para crear facturas');
      return;
    }
    
    setEditingInvoice(null);
    setFormData({
      invoiceNumber: '',
      supplierName: '',
      amount: '',
      date: new Date().toISOString().split('T')[0], // Fecha actual
      type: 'factura',
      description: '',
      file: null
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Abrir modal para editar factura
  const openEditInvoiceModal = (invoice) => {
    if (!hasPermission('edit_invoice')) {
      setError('No tienes permisos para editar facturas');
      return;
    }
    
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber || '',
      supplierName: invoice.supplierName || '',
      amount: invoice.amount?.toString() || '',
      date: invoice.date || '',
      type: invoice.type || 'factura',
      description: invoice.description || '',
      file: null // No cargar el archivo existente en el input
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setEditingInvoice(null);
    setFormData({
      invoiceNumber: '',
      supplierName: '',
      amount: '',
      date: '',
      type: 'factura',
      description: '',
      file: null
    });
    setFormErrors({});
  };

  // Guardar factura
  const saveInvoice = async () => {
    if (!validateInvoiceForm()) {
      return;
    }

    setUploading(true);
    try {
      let fileData = null;

      // Subir archivo si se seleccionó uno nuevo
      if (formData.file) {
        const fileName = `invoices/${Date.now()}_${formData.file.name}`;
        const storageRef = ref(storage, fileName);
        
        const snapshot = await uploadBytes(storageRef, formData.file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        fileData = {
          url: downloadURL,
          name: formData.file.name,
          path: fileName,
          type: formData.file.type,
          size: formData.file.size
        };
      }

      // Preparar datos de la factura
      const invoiceData = {
        invoiceNumber: formData.invoiceNumber.trim(),
        supplierName: formData.supplierName.trim(),
        amount: parseFloat(formData.amount),
        date: formData.date,
        type: formData.type,
        description: formData.description.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile.uid
      };

      // Agregar archivo si se subió uno nuevo
      if (fileData) {
        invoiceData.file = fileData;
      }

      if (editingInvoice) {
        // Actualizar factura existente
        const invoiceRef = doc(db, 'invoices', editingInvoice.id);
        await updateDoc(invoiceRef, invoiceData);
        setSuccess('Factura actualizada exitosamente');
      } else {
        // Crear nueva factura
        invoiceData.createdAt = new Date().toISOString();
        invoiceData.createdBy = userProfile.uid;
        
        const invoicesCollection = collection(db, 'invoices');
        await addDoc(invoicesCollection, invoiceData);
        setSuccess('Factura creada exitosamente');
      }

      // Recargar facturas
      await loadInvoices();
      closeModal();

    } catch (error) {
      console.error('Error guardando factura:', error);
      setError('Error al guardar la factura');
    } finally {
      setUploading(false);
    }
  };

  // Eliminar factura
  const deleteInvoice = async (invoice) => {
    if (!hasPermission('delete_invoice')) {
      setError('No tienes permisos para eliminar facturas');
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar la factura "${invoice.invoiceNumber}"?`)) {
      return;
    }

    try {
      // Eliminar archivo de Storage si existe
      if (invoice.file && invoice.file.path) {
        const fileRef = ref(storage, invoice.file.path);
        await deleteObject(fileRef);
      }

      // Eliminar factura de Firestore
      await deleteDoc(doc(db, 'invoices', invoice.id));
      
      setSuccess('Factura eliminada exitosamente');
      await loadInvoices();
      
    } catch (error) {
      console.error('Error eliminando factura:', error);
      setError('Error al eliminar la factura');
    }
  };

  // Obtener tipo de archivo para mostrar ícono
  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') {
      return '📄';
    } else if (fileType?.startsWith('image/')) {
      return '🖼️';
    }
    return '📎';
  };

  // Obtener color según tipo de factura
  const getTypeColor = (type) => {
    switch (type) {
      case 'factura':
        return 'bg-blue-100 text-blue-800';
      case 'nota_credito':
        return 'bg-green-100 text-green-800';
      case 'nota_debito':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-rosema-gray-100 text-rosema-gray-800';
    }
  };

  // Obtener nombre del tipo
  const getTypeName = (type) => {
    switch (type) {
      case 'factura':
        return 'Factura';
      case 'nota_credito':
        return 'Nota de Crédito';
      case 'nota_debito':
        return 'Nota de Débito';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" text="Cargando facturas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-rosema-dark">Facturas ARCA</h1>
        <button
          onClick={openNewInvoiceModal}
          className="btn-primary"
          disabled={!hasPermission('create_invoice')}
        >
          Nueva Factura
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

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Buscar facturas</label>
            <input
              type="text"
              placeholder="Número, proveedor o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Filtrar por tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-input"
            >
              <option value="">Todos los tipos</option>
              <option value="factura">Facturas</option>
              <option value="nota_credito">Notas de Crédito</option>
              <option value="nota_debito">Notas de Débito</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de facturas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvoices.length === 0 ? (
          <div className="col-span-full">
            <div className="card text-center py-12">
              <p className="text-rosema-gray-500 text-lg">
                No se encontraron facturas
              </p>
            </div>
          </div>
        ) : (
          filteredInvoices.map(invoice => (
            <div key={invoice.id} className="card hover:shadow-lg transition-shadow">
              {/* Header de la tarjeta */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(invoice.type)}`}>
                      {getTypeName(invoice.type)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-rosema-dark mb-1">
                    {invoice.invoiceNumber}
                  </h3>
                  <p className="text-sm text-rosema-gray-600">
                    {invoice.supplierName}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditInvoiceModal(invoice)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    disabled={!hasPermission('edit_invoice')}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteInvoice(invoice)}
                    className="text-red-600 hover:text-red-800 text-sm"
                    disabled={!hasPermission('delete_invoice')}
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Información de la factura */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-rosema-gray-500">Monto:</span>
                  <span className="text-sm font-semibold text-rosema-dark">
                    ${invoice.amount?.toLocaleString('es-AR')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-rosema-gray-500">Fecha:</span>
                  <span className="text-sm text-rosema-dark">
                    {new Date(invoice.date).toLocaleDateString('es-AR')}
                  </span>
                </div>

                {invoice.description && (
                  <div className="mt-3">
                    <p className="text-sm text-rosema-gray-600">
                      {invoice.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Archivo */}
              {invoice.file && (
                <div className="border-t border-rosema-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">
                        {getFileIcon(invoice.file.type)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-rosema-dark truncate max-w-32">
                          {invoice.file.name}
                        </p>
                        <p className="text-xs text-rosema-gray-500">
                          {(invoice.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <a
                      href={invoice.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Ver
                    </a>
                  </div>
                </div>
              )}

              {/* Información de creación */}
              <div className="border-t border-rosema-gray-200 pt-3 mt-4">
                <p className="text-xs text-rosema-gray-500">
                  Creado: {formatDateTime(invoice.createdAt)}
                </p>
                {invoice.updatedAt !== invoice.createdAt && (
                  <p className="text-xs text-rosema-gray-500">
                    Actualizado: {formatDateTime(invoice.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de factura */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-rosema-dark">
                  {editingInvoice ? 'Editar Factura' : 'Nueva Factura'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-rosema-gray-400 hover:text-rosema-gray-600"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                {/* Número de factura */}
                <div className="form-group">
                  <label className="form-label">Número de Factura *</label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.invoiceNumber ? 'form-error' : ''}`}
                    placeholder="Ej: 001-001-00000123"
                  />
                  {formErrors.invoiceNumber && (
                    <p className="error-message">{formErrors.invoiceNumber}</p>
                  )}
                </div>

                {/* Proveedor */}
                <div className="form-group">
                  <label className="form-label">Proveedor *</label>
                  <input
                    type="text"
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.supplierName ? 'form-error' : ''}`}
                    placeholder="Nombre del proveedor"
                  />
                  {formErrors.supplierName && (
                    <p className="error-message">{formErrors.supplierName}</p>
                  )}
                </div>

                {/* Monto y Fecha */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Monto *</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className={`form-input ${formErrors.amount ? 'form-error' : ''}`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                    {formErrors.amount && (
                      <p className="error-message">{formErrors.amount}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fecha *</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className={`form-input ${formErrors.date ? 'form-error' : ''}`}
                    />
                    {formErrors.date && (
                      <p className="error-message">{formErrors.date}</p>
                    )}
                  </div>
                </div>

                {/* Tipo */}
                <div className="form-group">
                  <label className="form-label">Tipo de Documento</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="factura">Factura</option>
                    <option value="nota_credito">Nota de Crédito</option>
                    <option value="nota_debito">Nota de Débito</option>
                  </select>
                </div>

                {/* Descripción */}
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-input"
                    rows="3"
                    placeholder="Descripción opcional del documento"
                  />
                </div>

                {/* Archivo */}
                <div className="form-group">
                  <label className="form-label">
                    Archivo {!editingInvoice && '*'}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className={`form-input ${formErrors.file ? 'form-error' : ''}`}
                    disabled={uploading}
                  />
                  <p className="text-xs text-rosema-gray-500 mt-1">
                    Formatos permitidos: PDF, JPG, PNG. Tamaño máximo: 10MB
                  </p>
                  {formErrors.file && (
                    <p className="error-message">{formErrors.file}</p>
                  )}
                  
                  {/* Mostrar archivo actual si está editando */}
                  {editingInvoice && editingInvoice.file && (
                    <div className="mt-2 p-2 bg-rosema-gray-50 rounded">
                      <p className="text-sm text-rosema-gray-600">
                        Archivo actual: {editingInvoice.file.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-rosema-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                    disabled={uploading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={saveInvoice}
                    className="btn-primary"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="flex items-center">
                        <LoadingSpinner size="small" color="white" />
                        <span className="ml-2">Guardando...</span>
                      </div>
                    ) : (
                      editingInvoice ? 'Actualizar' : 'Crear'
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

export default Facturas;
