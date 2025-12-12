const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../config/cache');
const {
    getProveedores,
    getProveedorById,
    createProveedor,
    updateProveedor,
    deleteProveedor
} = require('../controllers/proveedoresController');

// Rutas de proveedores
router.get('/', cacheMiddleware(300), getProveedores);
router.get('/:id', cacheMiddleware(300), getProveedorById);
router.post('/', createProveedor);
router.put('/:id', updateProveedor);
router.delete('/:id', deleteProveedor);

module.exports = router;
