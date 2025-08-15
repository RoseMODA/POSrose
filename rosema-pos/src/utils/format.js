// Funciones de formateo para el sistema POS Rosema
// Estas funciones ayudan a mantener consistencia en la presentación de datos

/**
 * Formatea un precio en pesos argentinos
 * @param {number} price - El precio a formatear
 * @returns {string} - El precio formateado como moneda argentina
 * 
 * Ejemplo: formatPrice(1500) -> "$1.500,00"
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined || isNaN(price)) {
    return "$0,00";
  }
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

/**
 * Formatea un número sin símbolo de moneda
 * @param {number} number - El número a formatear
 * @returns {string} - El número formateado con separadores de miles
 * 
 * Ejemplo: formatNumber(1500) -> "1.500"
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return "0";
  }
  
  return new Intl.NumberFormat('es-AR').format(number);
};

/**
 * Calcula el porcentaje de ganancia entre precio de compra y venta
 * @param {number} buyPrice - Precio de compra
 * @param {number} sellPrice - Precio de venta
 * @returns {number} - Porcentaje de ganancia
 * 
 * Ejemplo: calculateProfitPercentage(100, 150) -> 50
 */
export const calculateProfitPercentage = (buyPrice, sellPrice) => {
  if (!buyPrice || buyPrice <= 0) return 0;
  if (!sellPrice || sellPrice <= 0) return 0;
  
  const profit = sellPrice - buyPrice;
  const percentage = (profit / buyPrice) * 100;
  
  return Math.round(percentage * 100) / 100; // Redondear a 2 decimales
};

/**
 * Formatea una fecha en formato argentino
 * @param {Date|string} date - La fecha a formatear
 * @returns {string} - La fecha formateada
 * 
 * Ejemplo: formatDate(new Date()) -> "15/08/2024"
 */
export const formatDate = (date) => {
  if (!date) return "";
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) return "";
  
  return dateObj.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatea una fecha y hora en formato argentino
 * @param {Date|string} date - La fecha a formatear
 * @returns {string} - La fecha y hora formateada
 * 
 * Ejemplo: formatDateTime(new Date()) -> "15/08/2024 14:30"
 */
export const formatDateTime = (date) => {
  if (!date) return "";
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) return "";
  
  return dateObj.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} str - El string a capitalizar
 * @returns {string} - El string capitalizado
 * 
 * Ejemplo: capitalizeWords("juan pérez") -> "Juan Pérez"
 */
export const capitalizeWords = (str) => {
  if (!str) return "";
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formatea un número de teléfono argentino
 * @param {string} phone - El número de teléfono
 * @returns {string} - El número formateado
 * 
 * Ejemplo: formatPhone("1123456789") -> "+54 11 2345-6789"
 */
export const formatPhone = (phone) => {
  if (!phone) return "";
  
  // Remover todos los caracteres que no sean números
  const numbers = phone.replace(/\D/g, '');
  
  // Si empieza con 54, es un número argentino completo
  if (numbers.startsWith('54') && numbers.length >= 12) {
    const areaCode = numbers.slice(2, 4);
    const firstPart = numbers.slice(4, 8);
    const secondPart = numbers.slice(8, 12);
    return `+54 ${areaCode} ${firstPart}-${secondPart}`;
  }
  
  // Si es un número local (10 dígitos)
  if (numbers.length === 10) {
    const areaCode = numbers.slice(0, 2);
    const firstPart = numbers.slice(2, 6);
    const secondPart = numbers.slice(6, 10);
    return `+54 ${areaCode} ${firstPart}-${secondPart}`;
  }
  
  return phone; // Devolver original si no coincide con formato esperado
};

/**
 * Genera un código de producto único
 * @param {string} category - Categoría del producto
 * @param {number} index - Índice del producto en la categoría
 * @returns {string} - Código único del producto
 * 
 * Ejemplo: generateProductCode("remeras", 1) -> "REM001"
 */
export const generateProductCode = (category, index) => {
  if (!category) return `PROD${String(index).padStart(3, '0')}`;
  
  const prefix = category
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3)
    .padEnd(3, 'X');
  
  return `${prefix}${String(index).padStart(3, '0')}`;
};

/**
 * Calcula el descuento aplicado
 * @param {number} total - Total antes del descuento
 * @param {number} discount - Descuento (puede ser porcentaje o monto fijo)
 * @param {boolean} isPercentage - Si el descuento es porcentaje (true) o monto fijo (false)
 * @returns {object} - Objeto con el descuento aplicado y el total final
 */
export const calculateDiscount = (total, discount, isPercentage = true) => {
  if (!total || total <= 0) return { discountAmount: 0, finalTotal: 0 };
  if (!discount || discount <= 0) return { discountAmount: 0, finalTotal: total };
  
  let discountAmount = 0;
  
  if (isPercentage) {
    // Descuento por porcentaje
    discountAmount = (total * discount) / 100;
  } else {
    // Descuento por monto fijo
    discountAmount = discount;
  }
  
  // Asegurar que el descuento no sea mayor al total
  discountAmount = Math.min(discountAmount, total);
  
  const finalTotal = total - discountAmount;
  
  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalTotal: Math.round(finalTotal * 100) / 100
  };
};
