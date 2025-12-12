const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../config/cache');
const {
    getInventario,
    getInventarioById,
    createInventario,
    updateInventario,
    deleteInventario,
    updateStock,
    getStockBajo
} = require('../controllers/inventarioController');

// Rutas de inventario
router.get('/', cacheMiddleware(300), getInventario);
router.get('/stock-bajo', cacheMiddleware(60), getStockBajo);
router.get('/:id', cacheMiddleware(300), getInventarioById);
router.post('/', createInventario);
router.put('/:id', updateInventario);
router.delete('/:id', deleteInventario);
router.patch('/:id/stock', updateStock);

module.exports = router;
