// Página de Productos para el sistema POS Rosema
// Gestión completa de productos con CRUD, imágenes y control de stock

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, calculateProfitPercentage, generateProductCode } from '../utils/format';
import { validateForm, sanitizeFormData } from '../utils/validations';
import LoadingSpinner from '../components/LoadingSpinner';

const Productos = () => {
  // Estados principales
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    buyPrice: '',
    sellPrice: '',
    category: '',
    tags: '',
    sizes: '',
    stock: '',
    supplier: '',
    description: '',
    images: []
  });
  
  // Estados de UI
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const { userProfile, hasPermission } = useAuth();

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  // Función para cargar productos y proveedores
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar productos
      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

      // Cargar proveedores
      const suppliersCollection = collection(db, 'suppliers');
      const suppliersSnapshot = await getDocs(suppliersCollection);
      const suppliersData = suppliersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSuppliers(suppliersData);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Obtener categorías únicas
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || product.category === filterCategory;
    
    return matchesSearch && matchesCategory;
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

  // Manejar carga de imágenes
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        // Validar archivo
        if (!file.type.startsWith('image/')) {
          throw new Error('Solo se permiten archivos de imagen');
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB
          throw new Error('La imagen no puede ser mayor a 5MB');
        }

        // Generar nombre único para el archivo
        const fileName = `products/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        
        // Subir archivo
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return {
          url: downloadURL,
          name: file.name,
          path: fileName
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
      
    } catch (error) {
      console.error('Error subiendo imágenes:', error);
      setError(error.message || 'Error al subir las imágenes');
    } finally {
      setUploading(false);
    }
  };

  // Remover imagen
  const removeImage = async (imageIndex) => {
    const image = formData.images[imageIndex];
    
    try {
      // Eliminar de Storage si tiene path
      if (image.path) {
        const imageRef = ref(storage, image.path);
        await deleteObject(imageRef);
      }
      
      // Remover de la lista
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, index) => index !== imageIndex)
      }));
      
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      // Continuar removiendo de la lista aunque falle la eliminación en Storage
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, index) => index !== imageIndex)
      }));
    }
  };

  // Validar formulario
  const validateProductForm = () => {
    const rules = {
      name: { required: true, minLength: 2 },
      code: { required: true, minLength: 3 },
      buyPrice: { required: true, price: true },
      sellPrice: { required: true, price: true },
      category: { required: true },
      stock: { required: true, stock: true }
    };

    const validation = validateForm(formData, rules);
    
    // Validaciones adicionales
    if (validation.isValid) {
      const buyPrice = parseFloat(formData.buyPrice);
      const sellPrice = parseFloat(formData.sellPrice);
      
      if (sellPrice <= buyPrice) {
        validation.isValid = false;
        validation.errors.sellPrice = 'El precio de venta debe ser mayor al precio de compra';
      }
      
      // Verificar código único (solo para productos nuevos o si cambió el código)
      const existingProduct = products.find(p => 
        p.code === formData.code && p.id !== editingProduct?.id
      );
      
      if (existingProduct) {
        validation.isValid = false;
        validation.errors.code = 'Ya existe un producto con este código';
      }
    }

    setFormErrors(validation.errors);
    return validation.isValid;
  };

  // Abrir modal para nuevo producto
  const openNewProductModal = () => {
    if (!hasPermission('create_product')) {
      setError('No tienes permisos para crear productos');
      return;
    }
    
    setEditingProduct(null);
    setFormData({
      name: '',
      code: generateProductCode('', products.length + 1),
      buyPrice: '',
      sellPrice: '',
      category: '',
      tags: '',
      sizes: '',
      stock: '',
      supplier: '',
      description: '',
      images: []
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Abrir modal para editar producto
  const openEditProductModal = (product) => {
    if (!hasPermission('edit_product')) {
      setError('No tienes permisos para editar productos');
      return;
    }
    
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      code: product.code || '',
      buyPrice: product.buyPrice?.toString() || '',
      sellPrice: product.sellPrice?.toString() || '',
      category: product.category || '',
      tags: product.tags || '',
      sizes: product.sizes || '',
      stock: product.stock?.toString() || '',
      supplier: product.supplier || '',
      description: product.description || '',
      images: product.images || []
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      code: '',
      buyPrice: '',
      sellPrice: '',
      category: '',
      tags: '',
      sizes: '',
      stock: '',
      supplier: '',
      description: '',
      images: []
    });
    setFormErrors({});
  };

  // Guardar producto
  const saveProduct = async () => {
    if (!validateProductForm()) {
      return;
    }

    setUploading(true);
    try {
      // Sanitizar datos
      const sanitizedData = sanitizeFormData(formData, [
        'name', 'code', 'category', 'tags', 'sizes', 'description'
      ]);

      // Preparar datos del producto
      const productData = {
        ...sanitizedData,
        buyPrice: parseFloat(sanitizedData.buyPrice),
        sellPrice: parseFloat(sanitizedData.sellPrice),
        stock: parseInt(sanitizedData.stock),
        profitPercentage: calculateProfitPercentage(
          parseFloat(sanitizedData.buyPrice),
          parseFloat(sanitizedData.sellPrice)
        ),
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile.uid
      };

      if (editingProduct) {
        // Actualizar producto existente
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, productData);
        setSuccess('Producto actualizado exitosamente');
      } else {
        // Crear nuevo producto
        productData.createdAt = new Date().toISOString();
        productData.createdBy = userProfile.uid;
        
        const productsCollection = collection(db, 'products');
        await addDoc(productsCollection, productData);
        setSuccess('Producto creado exitosamente');
      }

      // Recargar productos
      await loadData();
      closeModal();

    } catch (error) {
      console.error('Error guardando producto:', error);
      setError('Error al guardar el producto');
    } finally {
      setUploading(false);
    }
  };

  // Eliminar producto
  const deleteProduct = async (product) => {
    if (!hasPermission('delete_product')) {
      setError('No tienes permisos para eliminar productos');
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
      return;
    }

    try {
      // Eliminar imágenes de Storage
      if (product.images && product.images.length > 0) {
        const deletePromises = product.images.map(async (image) => {
          if (image.path) {
            const imageRef = ref(storage, image.path);
            await deleteObject(imageRef);
          }
        });
        await Promise.all(deletePromises);
      }

      // Eliminar producto de Firestore
      await deleteDoc(doc(db, 'products', product.id));
      
      setSuccess('Producto eliminado exitosamente');
      await loadData();
      
    } catch (error) {
      console.error('Error eliminando producto:', error);
      setError('Error al eliminar el producto');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" text="Cargando productos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-rosema-dark">Gestión de Productos</h1>
        <button
          onClick={openNewProductModal}
          className="btn-primary"
          disabled={!hasPermission('create_product')}
        >
          Nuevo Producto
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
            <label className="form-label">Buscar productos</label>
            <input
              type="text"
              placeholder="Nombre, código o tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Filtrar por categoría</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="form-input"
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-right">Precio Compra</th>
                <th className="px-4 py-3 text-right">Precio Venta</th>
                <th className="px-4 py-3 text-right">Ganancia</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-rosema-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="font-medium text-rosema-dark">
                            {product.name}
                          </div>
                          {product.tags && (
                            <div className="text-sm text-rosema-gray-500">
                              {product.tags}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {product.code}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {product.category}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {formatPrice(product.buyPrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold">
                      {formatPrice(product.sellPrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <span className="text-green-600">
                        {product.profitPercentage?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock <= 5 
                          ? 'bg-red-100 text-red-800'
                          : product.stock <= 20
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => openEditProductModal(product)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          disabled={!hasPermission('edit_product')}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteProduct(product)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          disabled={!hasPermission('delete_product')}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-rosema-dark">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
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
                      placeholder="Nombre del producto"
                    />
                    {formErrors.name && (
                      <p className="error-message">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Código *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className={`form-input ${formErrors.code ? 'form-error' : ''}`}
                      placeholder="Código único"
                    />
                    {formErrors.code && (
                      <p className="error-message">{formErrors.code}</p>
                    )}
                  </div>
                </div>

                {/* Precios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Precio de Compra *</label>
                    <input
                      type="number"
                      name="buyPrice"
                      value={formData.buyPrice}
                      onChange={handleInputChange}
                      className={`form-input ${formErrors.buyPrice ? 'form-error' : ''}`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                    {formErrors.buyPrice && (
                      <p className="error-message">{formErrors.buyPrice}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Precio de Venta *</label>
                    <input
                      type="number"
                      name="sellPrice"
                      value={formData.sellPrice}
                      onChange={handleInputChange}
                      className={`form-input ${formErrors.sellPrice ? 'form-error' : ''}`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                    {formErrors.sellPrice && (
                      <p className="error-message">{formErrors.sellPrice}</p>
                    )}
                    {formData.buyPrice && formData.sellPrice && (
                      <p className="text-sm text-green-600 mt-1">
                        Ganancia: {calculateProfitPercentage(
                          parseFloat(formData.buyPrice),
                          parseFloat(formData.sellPrice)
                        ).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>

                {/* Categoría y Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`form-input ${formErrors.category ? 'form-error' : ''}`}
                      placeholder="Ej: Remeras, Pantalones"
                      list="categories"
                    />
                    <datalist id="categories">
                      {categories.map(category => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                    {formErrors.category && (
                      <p className="error-message">{formErrors.category}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className={`form-input ${formErrors.stock ? 'form-error' : ''}`}
                      placeholder="0"
                      min="0"
                    />
                    {formErrors.stock && (
                      <p className="error-message">{formErrors.stock}</p>
                    )}
                  </div>
                </div>

                {/* Tags y Talles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Tags</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Ej: casual, verano, algodón"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Talles</label>
                    <input
                      type="text"
                      name="sizes"
                      value={formData.sizes}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Ej: S, M, L, XL"
                    />
                  </div>
                </div>

                {/* Proveedor */}
                <div className="form-group">
                  <label className="form-label">Proveedor</label>
                  <select
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="">Seleccionar proveedor</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
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
                    placeholder="Descripción del producto"
                  />
                </div>

                {/* Imágenes */}
                <div className="form-group">
                  <label className="form-label">Imágenes</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="form-input"
                    disabled={uploading}
                  />
                  
                  {/* Vista previa de imágenes */}
                  {formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.url}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
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
                    onClick={saveProduct}
                    className="btn-primary"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="flex items-center">
                        <LoadingSpinner size="small" color="white" />
                        <span className="ml-2">Guardando...</span>
                      </div>
                    ) : (
                      editingProduct ? 'Actualizar' : 'Crear'
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

export default Productos;
