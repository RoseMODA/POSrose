// Página de Estadísticas para el sistema POS Rosema
// Muestra métricas, gráficos y reportes de ventas

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, formatDate } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';

const Estadisticas = () => {
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week'); // today, week, month, year, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Estados de datos
  const [salesData, setSalesData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    averageTicket: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalAssets: 0,
    totalInvested: 0
  });
  
  // Estados de UI
  const [error, setError] = useState(null);

  const { userProfile } = useAuth();

  // Cargar datos al montar el componente y cuando cambie el rango de fechas
  useEffect(() => {
    loadStatistics();
  }, [dateRange, customStartDate, customEndDate]);

  // Función para obtener el rango de fechas
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Domingo
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        endDate = new Date(weekStart);
        endDate.setDate(weekStart.getDate() + 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setDate(endDate.getDate() + 1); // Incluir el día final
        } else {
          return null;
        }
        break;
      default:
        return null;
    }

    return { startDate, endDate };
  };

  // Función para cargar estadísticas
  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateRangeObj = getDateRange();
      if (!dateRangeObj) {
        setLoading(false);
        return;
      }

      const { startDate, endDate } = dateRangeObj;

      // Cargar ventas del período
      const salesCollection = collection(db, 'sales');
      const salesQuery = query(
        salesCollection,
        where('createdAt', '>=', startDate.toISOString()),
        where('createdAt', '<', endDate.toISOString()),
        orderBy('createdAt', 'desc')
      );
      const salesSnapshot = await getDocs(salesQuery);
      const salesData = salesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Cargar todos los productos para calcular activos
      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calcular métricas
      const calculatedMetrics = calculateMetrics(salesData, productsData);

      setSalesData(salesData);
      setProductsData(productsData);
      setMetrics(calculatedMetrics);

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular métricas
  const calculateMetrics = (sales, products) => {
    // Métricas de ventas
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calcular ganancia total (aproximada)
    let totalProfit = 0;
    sales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product && product.buyPrice) {
            const profit = (item.unitPrice - product.buyPrice) * item.quantity;
            totalProfit += profit;
          }
        });
      }
    });

    // Métricas de productos
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => (p.stock || 0) <= 5).length;

    // Calcular activos totales (valor de inventario a precio de venta)
    const totalAssets = products.reduce((sum, product) => {
      return sum + ((product.sellPrice || 0) * (product.stock || 0));
    }, 0);

    // Calcular total invertido (valor de inventario a precio de compra)
    const totalInvested = products.reduce((sum, product) => {
      return sum + ((product.buyPrice || 0) * (product.stock || 0));
    }, 0);

    return {
      totalSales,
      totalRevenue,
      totalProfit,
      averageTicket,
      totalProducts,
      lowStockProducts,
      totalAssets,
      totalInvested
    };
  };

  // Agrupar ventas por día para el gráfico
  const getSalesByDay = () => {
    const salesByDay = {};
    
    salesData.forEach(sale => {
      const date = formatDate(sale.createdAt);
      if (!salesByDay[date]) {
        salesByDay[date] = {
          date,
          sales: 0,
          revenue: 0
        };
      }
      salesByDay[date].sales += 1;
      salesByDay[date].revenue += sale.total || 0;
    });

    return Object.values(salesByDay).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Obtener productos más vendidos
  const getTopProducts = () => {
    const productSales = {};
    
    salesData.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              id: item.productId,
              name: item.name,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.subtotal || 0;
        });
      }
    });

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  // Obtener métodos de pago más usados
  const getPaymentMethods = () => {
    const paymentMethods = {};
    
    salesData.forEach(sale => {
      const method = sale.paymentMethod || 'efectivo';
      if (!paymentMethods[method]) {
        paymentMethods[method] = {
          method,
          count: 0,
          revenue: 0
        };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].revenue += sale.total || 0;
    });

    return Object.values(paymentMethods).sort((a, b) => b.count - a.count);
  };

  const dailySales = getSalesByDay();
  const topProducts = getTopProducts();
  const paymentMethods = getPaymentMethods();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" text="Cargando estadísticas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-rosema-dark">Estadísticas y Reportes</h1>
        <div className="text-sm text-rosema-gray-600">
          Usuario: {userProfile?.name}
        </div>
      </div>

      {/* Error */}
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

      {/* Filtros de fecha */}
      <div className="card">
        <h2 className="text-lg font-semibold text-rosema-dark mb-4">Período de Análisis</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <button
            onClick={() => setDateRange('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dateRange === 'today' 
                ? 'bg-rosema-red text-white' 
                : 'bg-rosema-gray-100 text-rosema-gray-700 hover:bg-rosema-gray-200'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dateRange === 'week' 
                ? 'bg-rosema-red text-white' 
                : 'bg-rosema-gray-100 text-rosema-gray-700 hover:bg-rosema-gray-200'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dateRange === 'month' 
                ? 'bg-rosema-red text-white' 
                : 'bg-rosema-gray-100 text-rosema-gray-700 hover:bg-rosema-gray-200'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setDateRange('year')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dateRange === 'year' 
                ? 'bg-rosema-red text-white' 
                : 'bg-rosema-gray-100 text-rosema-gray-700 hover:bg-rosema-gray-200'
            }`}
          >
            Este Año
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dateRange === 'custom' 
                ? 'bg-rosema-red text-white' 
                : 'bg-rosema-gray-100 text-rosema-gray-700 hover:bg-rosema-gray-200'
            }`}
          >
            Personalizado
          </button>
        </div>

        {/* Fechas personalizadas */}
        {dateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Ventas Totales</h3>
          <p className="text-3xl font-bold">{metrics.totalSales}</p>
          <p className="text-sm opacity-90">transacciones</p>
        </div>

        <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Ingresos</h3>
          <p className="text-3xl font-bold">{formatPrice(metrics.totalRevenue)}</p>
          <p className="text-sm opacity-90">facturado</p>
        </div>

        <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Ganancia</h3>
          <p className="text-3xl font-bold">{formatPrice(metrics.totalProfit)}</p>
          <p className="text-sm opacity-90">estimada</p>
        </div>

        <div className="card bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Ticket Promedio</h3>
          <p className="text-3xl font-bold">{formatPrice(metrics.averageTicket)}</p>
          <p className="text-sm opacity-90">por venta</p>
        </div>
      </div>

      {/* Métricas de inventario */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-rosema-dark mb-2">Productos</h3>
          <p className="text-2xl font-bold text-rosema-red">{metrics.totalProducts}</p>
          <p className="text-sm text-rosema-gray-600">en catálogo</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-rosema-dark mb-2">Stock Bajo</h3>
          <p className="text-2xl font-bold text-yellow-600">{metrics.lowStockProducts}</p>
          <p className="text-sm text-rosema-gray-600">productos (≤5 unidades)</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-rosema-dark mb-2">Total en Activos</h3>
          <p className="text-2xl font-bold text-green-600">{formatPrice(metrics.totalAssets)}</p>
          <p className="text-sm text-rosema-gray-600">valor de inventario</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-rosema-dark mb-2">Total Invertido</h3>
          <p className="text-2xl font-bold text-blue-600">{formatPrice(metrics.totalInvested)}</p>
          <p className="text-sm text-rosema-gray-600">costo de inventario</p>
        </div>
      </div>

      {/* Gráficos y tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por día */}
        <div className="card">
          <h3 className="text-lg font-semibold text-rosema-dark mb-4">Ventas por Día</h3>
          {dailySales.length > 0 ? (
            <div className="space-y-2">
              {dailySales.map((day, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-rosema-gray-50 rounded">
                  <span className="text-sm text-rosema-dark">{day.date}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-rosema-dark">{day.sales} ventas</span>
                    <br />
                    <span className="text-xs text-rosema-gray-600">{formatPrice(day.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-rosema-gray-500 text-center py-8">
              No hay ventas en el período seleccionado
            </p>
          )}
        </div>

        {/* Productos más vendidos */}
        <div className="card">
          <h3 className="text-lg font-semibold text-rosema-dark mb-4">Productos Más Vendidos</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-2">
              {topProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-rosema-gray-50 rounded">
                  <div>
                    <span className="text-sm font-medium text-rosema-dark">{product.name}</span>
                    <br />
                    <span className="text-xs text-rosema-gray-600">{product.quantity} unidades</span>
                  </div>
                  <span className="text-sm font-semibold text-rosema-red">
                    {formatPrice(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-rosema-gray-500 text-center py-8">
              No hay datos de productos vendidos
            </p>
          )}
        </div>
      </div>

      {/* Métodos de pago */}
      <div className="card">
        <h3 className="text-lg font-semibold text-rosema-dark mb-4">Métodos de Pago</h3>
        {paymentMethods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentMethods.map((method, index) => (
              <div key={index} className="bg-rosema-gray-50 rounded-lg p-4 text-center">
                <h4 className="font-semibold text-rosema-dark capitalize mb-2">
                  {method.method}
                </h4>
                <p className="text-2xl font-bold text-rosema-red mb-1">
                  {method.count}
                </p>
                <p className="text-sm text-rosema-gray-600">
                  {formatPrice(method.revenue)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-rosema-gray-500 text-center py-8">
            No hay datos de métodos de pago
          </p>
        )}
      </div>

      {/* Resumen del período */}
      <div className="card">
        <h3 className="text-lg font-semibold text-rosema-dark mb-4">Resumen del Período</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-rosema-dark mb-2">Rendimiento de Ventas</h4>
            <ul className="text-sm text-rosema-gray-600 space-y-1">
              <li>• {metrics.totalSales} transacciones realizadas</li>
              <li>• {formatPrice(metrics.averageTicket)} de ticket promedio</li>
              <li>• {formatPrice(metrics.totalRevenue)} en ingresos totales</li>
              <li>• {formatPrice(metrics.totalProfit)} en ganancia estimada</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-rosema-dark mb-2">Estado del Inventario</h4>
            <ul className="text-sm text-rosema-gray-600 space-y-1">
              <li>• {metrics.totalProducts} productos en catálogo</li>
              <li>• {metrics.lowStockProducts} productos con stock bajo</li>
              <li>• {formatPrice(metrics.totalAssets)} en valor de inventario</li>
              <li>• {formatPrice(metrics.totalInvested)} invertido en stock</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-rosema-dark mb-2">Recomendaciones</h4>
            <ul className="text-sm text-rosema-gray-600 space-y-1">
              {metrics.lowStockProducts > 0 && (
                <li>• Revisar productos con stock bajo</li>
              )}
              {metrics.totalSales === 0 && (
                <li>• No hay ventas en este período</li>
              )}
              {metrics.averageTicket > 0 && (
                <li>• Mantener estrategias de venta actuales</li>
              )}
              <li>• Analizar productos más vendidos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;
