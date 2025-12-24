import axios from 'axios';
import API_URL from '../config/apiConfig';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para manejo de errores mejorado
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // Manejo específico de errores 429 (Too Many Requests)
        if (error.response?.status === 429 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Esperar 1 segundo antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('🔄 Reintentando petición después de rate limit...');
            return api(originalRequest);
        }

        // Manejo de errores de red
        if (!error.response) {
            console.error('❌ Error de red: No se pudo conectar con el servidor');
            error.message = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        } else {
            // Mensajes de error más descriptivos
            const status = error.response.status;
            const message = error.response.data?.message || error.message;

            switch (status) {
                case 400:
                    console.error('❌ Error 400: Datos inválidos -', message);
                    break;
                case 401:
                    console.error('❌ Error 401: No autorizado -', message);
                    break;
                case 404:
                    console.error('❌ Error 404: Recurso no encontrado -', message);
                    break;
                case 429:
                    console.error('⚠️ Error 429: Demasiadas peticiones -', message);
                    break;
                case 500:
                    console.error('❌ Error 500: Error del servidor -', message);
                    break;
                default:
                    console.error(`❌ Error ${status}:`, message);
            }
        }

        return Promise.reject(error);
    }
);

// ============================================
// PROVEEDORES
// ============================================

export const proveedoresAPI = {
    getAll: () => api.get('/proveedores'),
    getById: (id) => api.get(`/proveedores/${id}`),
    create: (data) => api.post('/proveedores', data),
    update: (id, data) => api.put(`/proveedores/${id}`, data),
    delete: (id) => api.delete(`/proveedores/${id}`)
};

// ============================================
// ÓRDENES DE COMPRA
// ============================================

export const ordenesAPI = {
    getAll: (params) => api.get('/ordenes', { params }),
    getById: (id) => api.get(`/ordenes/${id}`),
    create: (data) => api.post('/ordenes', data),
    update: (id, data) => api.put(`/ordenes/${id}`, data),
    delete: (id) => api.delete(`/ordenes/${id}`),
    downloadPDF: (id) => {
        window.open(`${API_URL}/ordenes/${id}/pdf`, '_blank');
    }
};

// ============================================
// FACTURAS - Carga de documentos
// ============================================

export const facturasAPI = {
    getAll: (params) => api.get('/facturas', { params }),
    getById: (id) => api.get(`/facturas/${id}`),
    create: (formData) => api.post('/facturas', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, formData) => api.put(`/facturas/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => api.delete(`/facturas/${id}`),
    download: (id) => {
        window.open(`${API_URL}/facturas/${id}/download`, '_blank');
    }
};

// ============================================
// ÓRDENES DE TRABAJO
// ============================================

export const ordenesTrabajoAPI = {
    getAll: (params) => api.get('/ordenes-trabajo', { params }),
    getById: (id) => api.get(`/ordenes-trabajo/${id}`),
    create: (data) => api.post('/ordenes-trabajo', data),
    update: (id, data) => api.put(`/ordenes-trabajo/${id}`, data),
    delete: (id) => api.delete(`/ordenes-trabajo/${id}`),
    downloadPDF: (id) => {
        window.open(`${API_URL}/ordenes-trabajo/${id}/pdf`, '_blank');
    }
};

// ============================================
// INVENTARIO
// ============================================

export const inventarioAPI = {
    getAll: (params) => api.get('/inventario', { params }),
    getById: (id) => api.get(`/inventario/${id}`),
    create: (data) => api.post('/inventario', data),
    update: (id, data) => api.put(`/inventario/${id}`, data),
    delete: (id) => api.delete(`/inventario/${id}`),
    updateStock: (id, data) => api.patch(`/inventario/${id}/stock`, data),
    getStockBajo: () => api.get('/inventario/stock-bajo')
};

export default api;
