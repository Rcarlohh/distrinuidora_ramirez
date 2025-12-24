const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARES DE SEGURIDAD Y OPTIMIZACIÓN
// ============================================

// Helmet para seguridad
app.use(helmet());

// Compresión de respuestas
app.use(compression());

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (más permisivo para desarrollo)
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 1000, // límite de 1000 requests por minuto
    message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================
// RUTAS
// ============================================

const authRoutes = require('./routes/auth');
const proveedoresRoutes = require('./routes/proveedores');
const ordenesRoutes = require('./routes/ordenes');
const facturasRoutes = require('./routes/facturas');
const ordenesTrabajoRoutes = require('./routes/ordenesTrabajo');
const inventarioRoutes = require('./routes/inventario');

app.use('/api/auth', authRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/ordenes-trabajo', ordenesTrabajoRoutes);
app.use('/api/inventario', inventarioRoutes);

// Servir archivos estáticos de uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API de Gestión de Compras',
        version: '1.0.0',
        endpoints: {
            proveedores: '/api/proveedores',
            ordenes: '/api/ordenes',
            facturas: '/api/facturas',
            health: '/api/health'
        }
    });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   🚀 SERVIDOR DE GESTIÓN DE COMPRAS INICIADO   ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📡 Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Base de datos: Supabase`);
    console.log(`⚡ Caché: Activado (TTL: ${process.env.CACHE_TTL || 300}s)`);
    console.log('');
    console.log('📋 Endpoints disponibles:');
    console.log(`   - GET    /api/health`);
    console.log(`   - GET    /api/proveedores`);
    console.log(`   - GET    /api/ordenes`);
    console.log(`   - GET    /api/facturas`);
    console.log('');
    console.log('Presiona CTRL+C para detener el servidor');
    console.log('══════════════════════════════════════════════════');

    // ============================================
    // KEEP-ALIVE PARA RENDER
    // ============================================
    // Evita que Render apague el servidor por inactividad
    // Hace un ping cada 14 minutos (Render apaga después de 15 min de inactividad)

    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
        const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutos
        const SERVER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

        console.log('');
        console.log('🔄 Keep-Alive activado para Render');
        console.log(`   Ping cada 14 minutos a: ${SERVER_URL}/api/health`);

        setInterval(async () => {
            try {
                const https = require('https');
                const http = require('http');
                const protocol = SERVER_URL.startsWith('https') ? https : http;

                protocol.get(`${SERVER_URL}/api/health`, (res) => {
                    if (res.statusCode === 200) {
                        console.log(`✅ Keep-Alive ping exitoso - ${new Date().toLocaleTimeString()}`);
                    }
                }).on('error', (err) => {
                    console.log(`⚠️ Keep-Alive ping falló: ${err.message}`);
                });
            } catch (error) {
                console.log(`⚠️ Error en Keep-Alive: ${error.message}`);
            }
        }, KEEP_ALIVE_INTERVAL);

        console.log('══════════════════════════════════════════════════');
    }
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('SIGTERM recibido. Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT recibido. Cerrando servidor...');
    process.exit(0);
});

module.exports = app;
