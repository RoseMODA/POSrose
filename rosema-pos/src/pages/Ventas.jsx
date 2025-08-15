// Página de Ventas para el sistema POS Rosema
// Permite gestionar el proceso completo de ventas con carrito, descuentos y pagos

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, calculateDiscount } from '../utils/format';
import { isValidPrice } from '../utils/validations';
import LoadingSpinner from '../components/LoadingSpinner';

const Ventas = () => {
  // Estados principales
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Estados del formulario de venta
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' o 'fixed'
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [isExchange, setIsExchange] = useState(false);
  
  // Estados de UI
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { userProfile } = useAuth();

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts();
  }, []);

  // Función para cargar productos desde Firestore
  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos según el término de búsqueda
  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agregar producto al carrito
  const addToCart = (product) => {
    if (product.stock <= 0) {
      setError('Producto sin stock disponible');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        setError('No hay suficiente stock disponible');
        return;
      }
      
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    setError(null);
  };

  // Actualizar cantidad en el carrito
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stock) {
      setError('Cantidad excede el stock disponible');
      return;
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
    setError(null);
  };

  // Remover producto del carrito
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Limpiar carrito
  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setDiscount(0);
    setIsExchange(false);
  };

  // Calcular totales
  const subtotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  const discountCalculation = calculateDiscount(subtotal, discount, discountType === 'percentage');
  const total = discountCalculation.finalTotal;

  // Procesar venta
  const processSale = async () => {
    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    if (total <= 0) {
      setError('El total debe ser mayor a cero');
      return;
    }

    setProcessingPayment(true);
    setError(null);

    try {
      // Crear documento de venta
      const saleData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          code: item.code,
          quantity: item.quantity,
          unitPrice: item.sellPrice,
          subtotal: item.sellPrice * item.quantity
        })),
        subtotal,
        discount: discountCalculation.discountAmount,
        discountType,
        total,
        paymentMethod,
        customerName: customerName.trim() || null,
        isExchange,
        sellerId: userProfile.uid,
        sellerName: userProfile.name,
        createdAt: new Date().toISOString(),
        status: 'completed'
      };

      // Guardar venta en Firestore
      const salesCollection = collection(db, 'sales');
      const saleDoc = await addDoc(salesCollection, saleData);

      // Actualizar stock de productos
      const stockUpdates = cart.map(async (item) => {
        const productRef = doc(db, 'products', item.id);
        await updateDoc(productRef, {
          stock: increment(-item.quantity),
          lastSold: new Date().toISOString()
        });
      });

      await Promise.all(stockUpdates);

      // Recargar productos para actualizar stock
      await loadProducts();

      setSuccess(`Venta procesada exitosamente. ID: ${saleDoc.id}`);
      clearCart();

      // Opcional: Imprimir recibo
      if (window.confirm('¿Deseas imprimir el recibo?')) {
        printReceipt(saleData, saleDoc.id);
      }

    } catch (error) {
      console.error('Error procesando venta:', error);
      setError('Error al procesar la venta. Intenta nuevamente.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Función para imprimir recibo
  const printReceipt = (saleData, saleId) => {
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Recibo - Rosema</title>
          <style>
            body { font-family: monospace; width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
            @media print { body { width: auto; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>ROSEMA</h2>
            <p>Recibo de Venta</p>
            <p>ID: ${saleId}</p>
            <p>${new Date().toLocaleString('es-AR')}</p>
          </div>
          
          ${saleData.customerName ? `<p><strong>Cliente:</strong> ${saleData.customerName}</p>` : ''}
          ${saleData.isExchange ? '<p><strong>CAMBIO</strong></p>' : ''}
          
          <div class="items">
            ${saleData.items.map(item => `
              <div class="item">
                <span>${item.name} x${item.quantity}</span>
                <span>${formatPrice(item.subtotal)}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="total">
            <div class="item">
              <span>Subtotal:</span>
              <span>${formatPrice(saleData.subtotal)}</span>
            </div>
            ${saleData.discount > 0 ? `
              <div class="item">
                <span>Descuento:</span>
                <span>-${formatPrice(saleData.discount)}</span>
              </div>
            ` : ''}
            <div class="item">
              <span>TOTAL:</span>
              <span>${formatPrice(saleData.total)}</span>
            </div>
            <div class="item">
              <span>Pago:</span>
              <span>${saleData.paymentMethod.toUpperCase()}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p>¡Gracias por su compra!</p>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
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
        <h1 className="text-2xl font-bold text-rosema-dark">Gestión de Ventas</h1>
        <div className="text-sm text-rosema-gray-600">
          Vendedor: {userProfile?.name}
        </div>
      </div>

      {/* Mensajes de error y éxito */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel izquierdo - Búsqueda y productos */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-rosema-dark mb-4">
              Buscar Productos
            </h2>
            
            {/* Barra de búsqueda */}
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input mb-4"
            />

            {/* Lista de productos */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredProducts.length === 0 ? (
                <p className="text-rosema-gray-500 text-center py-4">
                  No se encontraron productos
                </p>
              ) : (
                filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border border-rosema-gray-200 rounded-lg hover:bg-rosema-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-rosema-dark">
                        {product.name}
                      </h3>
                      <p className="text-sm text-rosema-gray-600">
                        Código: {product.code} | Stock: {product.stock}
                      </p>
                      <p className="text-sm font-semibold text-rosema-red">
                        {formatPrice(product.sellPrice)}
                      </p>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        product.stock <= 0
                          ? 'bg-rosema-gray-200 text-rosema-gray-500 cursor-not-allowed'
                          : 'btn-primary'
                      }`}
                    >
                      {product.stock <= 0 ? 'Sin Stock' : 'Agregar'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel derecho - Carrito y checkout */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-rosema-dark">
                Carrito de Compras
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Limpiar Carrito
                </button>
              )}
            </div>

            {/* Items del carrito */}
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-rosema-gray-500 text-center py-4">
                  El carrito está vacío
                </p>
              ) : (
                cart.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border border-rosema-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-rosema-dark">
                        {item.name}
                      </h4>
                      <p className="text-sm text-rosema-gray-600">
                        {formatPrice(item.sellPrice)} c/u
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-rosema-gray-200 text-rosema-gray-600 hover:bg-rosema-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-rosema-gray-200 text-rosema-gray-600 hover:bg-rosema-gray-300"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-semibold text-rosema-dark">
                        {formatPrice(item.sellPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Información de la venta */}
            {cart.length > 0 && (
              <div className="space-y-4 border-t border-rosema-gray-200 pt-4">
                {/* Cliente */}
                <div>
                  <label className="form-label">Cliente (opcional)</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre del cliente"
                    className="form-input"
                  />
                </div>

                {/* Cambio */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isExchange"
                    checked={isExchange}
                    onChange={(e) => setIsExchange(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="isExchange" className="text-sm text-rosema-dark">
                    Es un cambio
                  </label>
                </div>

                {/* Descuento */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="form-label">Descuento</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Tipo</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="form-input"
                    >
                      <option value="percentage">Porcentaje (%)</option>
                      <option value="fixed">Monto fijo ($)</option>
                    </select>
                  </div>
                </div>

                {/* Método de pago */}
                <div>
                  <label className="form-label">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-input"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                  </select>
                </div>

                {/* Totales */}
                <div className="bg-rosema-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discountCalculation.discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento:</span>
                      <span>-{formatPrice(discountCalculation.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-rosema-dark border-t border-rosema-gray-200 pt-2">
                    <span>TOTAL:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Botón de procesar venta */}
                <button
                  onClick={processSale}
                  disabled={processingPayment || cart.length === 0}
                  className={`w-full py-3 rounded-lg font-semibold ${
                    processingPayment
                      ? 'bg-rosema-gray-300 text-rosema-gray-500 cursor-not-allowed'
                      : 'btn-primary text-lg'
                  }`}
                >
                  {processingPayment ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="small" color="white" />
                      <span className="ml-2">Procesando...</span>
                    </div>
                  ) : (
                    'Procesar Venta'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ventas;
