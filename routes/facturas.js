const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../config/cache');
const {
    upload,
    getFacturas,
    getFacturaById,
    createFactura,
    updateFactura,
    deleteFactura,
    downloadFactura
} = require('../controllers/facturasController');

// Rutas de facturas - Carga de documentos
router.get('/', cacheMiddleware(180), getFacturas);
router.get('/:id', cacheMiddleware(180), getFacturaById);
router.post('/', upload.single('archivo'), createFactura);
router.put('/:id', upload.single('archivo'), updateFactura);
router.delete('/:id', deleteFactura);
router.get('/:id/download', downloadFactura);

module.exports = router;
