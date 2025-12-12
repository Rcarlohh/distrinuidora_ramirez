const supabase = require('../config/supabase');
const { invalidateCache } = require('../config/cache');

// Obtener todos los proveedores
const getProveedores = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('proveedores')
            .select('*')
            .order('nombre_social', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proveedores',
            error: error.message
        });
    }
};

// Obtener un proveedor por ID
const getProveedorById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('proveedores')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proveedor',
            error: error.message
        });
    }
};

// Crear proveedor
const createProveedor = async (req, res) => {
    try {
        const proveedorData = req.body;

        const { data, error } = await supabase
            .from('proveedores')
            .insert([proveedorData])
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché
        invalidateCache('proveedores');

        res.status(201).json({
            success: true,
            message: 'Proveedor creado exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear proveedor',
            error: error.message
        });
    }
};

// Actualizar proveedor
const updateProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const proveedorData = req.body;

        const { data, error } = await supabase
            .from('proveedores')
            .update(proveedorData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché
        invalidateCache('proveedores');

        res.json({
            success: true,
            message: 'Proveedor actualizado exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar proveedor',
            error: error.message
        });
    }
};

// Eliminar proveedor
const deleteProveedor = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('proveedores')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Invalidar caché
        invalidateCache('proveedores');

        res.json({
            success: true,
            message: 'Proveedor eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar proveedor',
            error: error.message
        });
    }
};

module.exports = {
    getProveedores,
    getProveedorById,
    createProveedor,
    updateProveedor,
    deleteProveedor
};
