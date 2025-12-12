const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambialo-en-produccion';

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Acceso no autorizado. Token no proporcionado'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

// Middleware opcional - permite acceso sin token
const optionalAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        }

        next();

    } catch (error) {
        // Si el token es inválido, simplemente continúa sin usuario
        next();
    }
};

module.exports = {
    authMiddleware,
    optionalAuth
};
