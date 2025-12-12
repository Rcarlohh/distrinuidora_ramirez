const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../config/cache');
const {
    getOrdenesTrabajo,
    getOrdenTrabajoById,
    createOrdenTrabajo,
    updateOrdenTrabajo,
    deleteOrdenTrabajo,
    generarPDFOrdenTrabajo
} = require('../controllers/ordenesTrabajoController');

// Rutas de órdenes de trabajo
router.get('/', cacheMiddleware(180), getOrdenesTrabajo);
router.get('/:id', cacheMiddleware(180), getOrdenTrabajoById);
router.post('/', createOrdenTrabajo);
router.put('/:id', updateOrdenTrabajo);
router.delete('/:id', deleteOrdenTrabajo);
router.get('/:id/pdf', generarPDFOrdenTrabajo);

module.exports = router;
