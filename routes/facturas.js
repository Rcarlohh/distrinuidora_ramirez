const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../config/cache');
const {
    getFacturas,
    getFacturaById,
    createFactura,
    updateFactura,
    deleteFactura,
    generarPDFFactura
} = require('../controllers/facturasController');

// Rutas de facturas
router.get('/', cacheMiddleware(180), getFacturas);
router.get('/:id', cacheMiddleware(180), getFacturaById);
router.post('/', createFactura);
router.put('/:id', updateFactura);
router.delete('/:id', deleteFactura);
router.get('/:id/pdf', generarPDFFactura);

module.exports = router;
