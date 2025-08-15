// Funciones de validación para formularios del sistema POS Rosema
// Estas funciones ayudan a validar datos de entrada y mantener la integridad de la información

/**
 * Valida si un campo es requerido (no está vacío)
 * @param {any} value - El valor a validar
 * @returns {boolean} - true si es válido, false si está vacío
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  return Boolean(value);
};

/**
 * Valida un email
 * @param {string} email - El email a validar
 * @returns {boolean} - true si es un email válido
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Valida un número de teléfono argentino
 * @param {string} phone - El teléfono a validar
 * @returns {boolean} - true si es un teléfono válido
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remover espacios, guiones y paréntesis
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  
  // Validar que solo contenga números
  if (!/^\d+$/.test(cleanPhone)) return false;
  
  // Validar longitud (10 dígitos para número local, 12 para número con código de país)
  return cleanPhone.length === 10 || (cleanPhone.startsWith('54') && cleanPhone.length === 12);
};

/**
 * Valida un CUIT argentino
 * @param {string} cuit - El CUIT a validar
 * @returns {boolean} - true si es un CUIT válido
 */
export const isValidCUIT = (cuit) => {
  if (!cuit || typeof cuit !== 'string') return false;
  
  // Remover guiones y espacios
  const cleanCuit = cuit.replace(/[\s\-]/g, '');
  
  // Debe tener exactamente 11 dígitos
  if (!/^\d{11}$/.test(cleanCuit)) return false;
  
  // Algoritmo de validación de CUIT
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCuit[i]) * multipliers[i];
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? remainder : 11 - remainder;
  
  return parseInt(cleanCuit[10]) === checkDigit;
};

/**
 * Valida un precio (debe ser un número positivo)
 * @param {any} price - El precio a validar
 * @returns {boolean} - true si es un precio válido
 */
export const isValidPrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice >= 0;
};

/**
 * Valida una cantidad de stock (debe ser un número entero no negativo)
 * @param {any} stock - El stock a validar
 * @returns {boolean} - true si es un stock válido
 */
export const isValidStock = (stock) => {
  const numStock = parseInt(stock);
  return !isNaN(numStock) && numStock >= 0 && Number.isInteger(numStock);
};

/**
 * Valida un código de producto (debe tener al menos 3 caracteres)
 * @param {string} code - El código a validar
 * @returns {boolean} - true si es un código válido
 */
export const isValidProductCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  return code.trim().length >= 3;
};

/**
 * Valida una contraseña (mínimo 6 caracteres)
 * @param {string} password - La contraseña a validar
 * @returns {boolean} - true si es una contraseña válida
 */
export const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
};

/**
 * Valida un porcentaje (debe estar entre 0 y 100)
 * @param {any} percentage - El porcentaje a validar
 * @returns {boolean} - true si es un porcentaje válido
 */
export const isValidPercentage = (percentage) => {
  const numPercentage = parseFloat(percentage);
  return !isNaN(numPercentage) && numPercentage >= 0 && numPercentage <= 100;
};

/**
 * Valida una fecha (no debe ser futura para fechas de nacimiento, etc.)
 * @param {string|Date} date - La fecha a validar
 * @param {boolean} allowFuture - Si se permiten fechas futuras
 * @returns {boolean} - true si es una fecha válida
 */
export const isValidDate = (date, allowFuture = true) => {
  if (!date) return false;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Verificar que sea una fecha válida
  if (isNaN(dateObj.getTime())) return false;
  
  // Si no se permiten fechas futuras, verificar que no sea mayor a hoy
  if (!allowFuture) {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin del día actual
    return dateObj <= today;
  }
  
  return true;
};

/**
 * Valida un archivo (tipo y tamaño)
 * @param {File} file - El archivo a validar
 * @param {Array} allowedTypes - Tipos de archivo permitidos (ej: ['image/jpeg', 'image/png'])
 * @param {number} maxSizeMB - Tamaño máximo en MB
 * @returns {object} - Objeto con isValid y mensaje de error si aplica
 */
export const validateFile = (file, allowedTypes = [], maxSizeMB = 5) => {
  if (!file) {
    return { isValid: false, error: 'No se ha seleccionado ningún archivo' };
  }
  
  // Validar tipo de archivo
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}` 
    };
  }
  
  // Validar tamaño de archivo
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB` 
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Valida un formulario completo
 * @param {object} data - Los datos del formulario
 * @param {object} rules - Las reglas de validación
 * @returns {object} - Objeto con isValid y errores por campo
 * 
 * Ejemplo de uso:
 * const rules = {
 *   name: { required: true, minLength: 2 },
 *   email: { required: true, email: true },
 *   price: { required: true, price: true }
 * };
 */
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];
    
    // Validar campo requerido
    if (fieldRules.required && !isRequired(value)) {
      errors[field] = 'Este campo es requerido';
      isValid = false;
      return;
    }
    
    // Si el campo está vacío y no es requerido, no validar más reglas
    if (!isRequired(value)) return;
    
    // Validar longitud mínima
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `Debe tener al menos ${fieldRules.minLength} caracteres`;
      isValid = false;
      return;
    }
    
    // Validar longitud máxima
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `No puede tener más de ${fieldRules.maxLength} caracteres`;
      isValid = false;
      return;
    }
    
    // Validar email
    if (fieldRules.email && !isValidEmail(value)) {
      errors[field] = 'Debe ser un email válido';
      isValid = false;
      return;
    }
    
    // Validar teléfono
    if (fieldRules.phone && !isValidPhone(value)) {
      errors[field] = 'Debe ser un teléfono válido';
      isValid = false;
      return;
    }
    
    // Validar CUIT
    if (fieldRules.cuit && !isValidCUIT(value)) {
      errors[field] = 'Debe ser un CUIT válido';
      isValid = false;
      return;
    }
    
    // Validar precio
    if (fieldRules.price && !isValidPrice(value)) {
      errors[field] = 'Debe ser un precio válido (número positivo)';
      isValid = false;
      return;
    }
    
    // Validar stock
    if (fieldRules.stock && !isValidStock(value)) {
      errors[field] = 'Debe ser una cantidad válida (número entero positivo)';
      isValid = false;
      return;
    }
    
    // Validar porcentaje
    if (fieldRules.percentage && !isValidPercentage(value)) {
      errors[field] = 'Debe ser un porcentaje válido (0-100)';
      isValid = false;
      return;
    }
  });
  
  return { isValid, errors };
};

/**
 * Sanitiza un string removiendo caracteres especiales
 * @param {string} str - El string a sanitizar
 * @returns {string} - El string sanitizado
 */
export const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>\"'&]/g, '') // Remover caracteres potencialmente peligrosos
    .replace(/\s+/g, ' '); // Normalizar espacios
};

/**
 * Valida y sanitiza datos de entrada
 * @param {object} data - Los datos a sanitizar
 * @param {Array} stringFields - Campos que deben ser sanitizados como strings
 * @returns {object} - Los datos sanitizados
 */
export const sanitizeFormData = (data, stringFields = []) => {
  const sanitized = { ...data };
  
  stringFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = sanitizeString(sanitized[field]);
    }
  });
  
  return sanitized;
};
