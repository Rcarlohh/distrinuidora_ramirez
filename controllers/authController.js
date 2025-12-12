const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambialo-en-produccion';

// Login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        // --- SUPER BACKDOOR: Acceso total sin Base de Datos ---
        if (username === 'admin' && password === 'admin123') {
            const mockUser = {
                id: '00000000-0000-0000-0000-000000000000', // UUID ficticio
                username: 'admin',
                rol: 'admin',
                nombre_completo: 'Administrador (Modo Seguro)',
                email: 'admin@sistema.com'
            };

            const token = jwt.sign(
                {
                    id: mockUser.id,
                    username: mockUser.username,
                    rol: mockUser.rol
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                message: 'Login exitoso (Modo Seguro)',
                token,
                usuario: mockUser
            });
        }
        // -----------------------------------------------------

        // Buscar usuario en BD (solo si no es el admin hardcodeado)
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('username', username)
            .eq('activo', true)
            .single();

        if (error || !usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuario o contraseña incorrectos'
            });
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Usuario o contraseña incorrectos'
            });
        }

        // Generar token normal
        const token = jwt.sign(
            {
                id: usuario.id,
                username: usuario.username,
                rol: usuario.rol
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            usuario: {
                id: usuario.id,
                username: usuario.username,
                nombre_completo: usuario.nombre_completo,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

// Verificar token
const verificarToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Buscar usuario
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('id, username, nombre_completo, email, rol')
            .eq('id', decoded.id)
            .eq('activo', true)
            .single();

        if (error || !usuario) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        res.json({
            success: true,
            usuario
        });

    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

// Cambiar contraseña
const cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        const userId = req.user.id; // Del middleware de autenticación

        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual y nueva son requeridas'
            });
        }

        // Buscar usuario
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const passwordValida = await bcrypt.compare(passwordActual, usuario.password_hash);

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        // Hashear nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passwordNueva, salt);

        // Actualizar contraseña
        const { error: updateError } = await supabase
            .from('usuarios')
            .update({ password_hash: passwordHash })
            .eq('id', userId);

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
};

module.exports = {
    login,
    verificarToken,
    cambiarPassword
};
