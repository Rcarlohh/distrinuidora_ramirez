const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../config/cache');
const {
    getOrdenes,
    getOrdenById,
    createOrden,
    updateOrden,
    deleteOrden,
    generarPDFOrden
} = require('../controllers/ordenesController');

// Rutas de órdenes
router.get('/', cacheMiddleware(180), getOrdenes);
router.get('/:id', cacheMiddleware(180), getOrdenById);
router.post('/', createOrden);
router.put('/:id', updateOrden);
router.delete('/:id', deleteOrden);
router.get('/:id/pdf', generarPDFOrden);

module.exports = router;
