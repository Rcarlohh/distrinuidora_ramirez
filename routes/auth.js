const express = require('express');
const router = express.Router();
const { login, verificarToken, cambiarPassword } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Rutas públicas
router.post('/login', login);
router.get('/verificar', verificarToken);

// Rutas protegidas
router.post('/cambiar-password', authMiddleware, cambiarPassword);

module.exports = router;
