import axios from 'axios';
import API_URL from '../config/apiConfig';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para manejo de errores
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error);
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
// FACTURAS
// ============================================

export const facturasAPI = {
    getAll: (params) => api.get('/facturas', { params }),
    getById: (id) => api.get(`/facturas/${id}`),
    create: (data) => api.post('/facturas', data),
    update: (id, data) => api.put(`/facturas/${id}`, data),
    delete: (id) => api.delete(`/facturas/${id}`),
    downloadPDF: (id) => {
        window.open(`${API_URL}/facturas/${id}/pdf`, '_blank');
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
