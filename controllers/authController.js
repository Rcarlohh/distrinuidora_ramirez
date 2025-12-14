const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambialo-en-produccion';

// Login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('🔐 Intento de login:', { username });

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        // --- SUPER BACKDOOR: Acceso total sin Base de Datos ---
        if (username === 'admin' && password === 'admin123') {
            console.log('✅ Login con credenciales hardcodeadas');
            
            const mockUser = {
                id: '00000000-0000-0000-0000-000000000000',
                username: 'admin',
                rol: 'admin',
                nombre_completo: 'Administrador del Sistema',
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
                message: 'Login exitoso',
                token,
                usuario: mockUser
            });
        }
        // -----------------------------------------------------

        // Buscar usuario en BD
        console.log('🔍 Buscando usuario en BD...');
        
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('username', username)
            .single();

        console.log('📊 Resultado búsqueda:', { 
            encontrado: !!usuario, 
            error: error?.message,
            activo: usuario?.activo 
        });

        if (error) {
            console.error('❌ Error de Supabase:', error);
            return res.status(401).json({
                success: false,
                message: 'Usuario o contraseña incorrectos'
            });
        }

        if (!usuario) {
            console.log('⚠️ Usuario no encontrado');
            return res.status(401).json({
                success: false,
                message: 'Usuario o contraseña incorrectos'
            });
        }

        if (!usuario.activo) {
            console.log('⚠️ Usuario inactivo');
            return res.status(401).json({
                success: false,
                message: 'Usuario desactivado. Contacte al administrador'
            });
        }

        // Verificar contraseña
        console.log('🔑 Verificando contraseña...');
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        console.log('🔓 Resultado verificación:', { passwordValida });

        if (!passwordValida) {
            console.log('❌ Contraseña incorrecta');
            return res.status(401).json({
                success: false,
                message: 'Usuario o contraseña incorrectos'
            });
        }

        // Generar token
        const token = jwt.sign(
            {
                id: usuario.id,
                username: usuario.username,
                rol: usuario.rol
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Login exitoso para:', usuario.username);

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
        console.error('💥 Error en login:', error);
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

        // Si es el usuario hardcodeado, no buscar en BD
        if (decoded.id === '00000000-0000-0000-0000-000000000000') {
            return res.json({
                success: true,
                usuario: {
                    id: decoded.id,
                    username: decoded.username,
                    nombre_completo: 'Administrador del Sistema',
                    email: 'admin@sistema.com',
                    rol: decoded.rol
                }
            });
        }

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
        const userId = req.user.id;

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