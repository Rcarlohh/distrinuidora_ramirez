const supabase = require('../config/supabase');
const { invalidateCache } = require('../config/cache');

// Obtener todo el inventario
const getInventario = async (req, res) => {
    try {
        const { activo, categoria, buscar } = req.query;

        let query = supabase
            .from('inventario')
            .select('*');

        if (activo !== undefined) {
            query = query.eq('activo', activo === 'true');
        }

        if (categoria) {
            query = query.eq('categoria', categoria);
        }

        if (buscar) {
            query = query.or(`nombre.ilike.%${buscar}%,codigo.ilike.%${buscar}%,descripcion.ilike.%${buscar}%`);
        }

        const { data, error } = await query.order('nombre', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener inventario',
            error: error.message
        });
    }
};

// Obtener un item por ID
const getInventarioById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('inventario')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado'
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener item:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener item',
            error: error.message
        });
    }
};

// Crear item de inventario
const createInventario = async (req, res) => {
    try {
        const itemData = req.body;

        const { data, error } = await supabase
            .from('inventario')
            .insert([itemData])
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché
        invalidateCache('inventario');

        res.status(201).json({
            success: true,
            message: 'Item creado exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al crear item:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear item',
            error: error.message
        });
    }
};

// Actualizar item de inventario
const updateInventario = async (req, res) => {
    try {
        const { id } = req.params;
        const itemData = req.body;

        const { data, error } = await supabase
            .from('inventario')
            .update(itemData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché
        invalidateCache('inventario');

        res.json({
            success: true,
            message: 'Item actualizado exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al actualizar item:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar item',
            error: error.message
        });
    }
};

// Eliminar item de inventario
const deleteInventario = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('inventario')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Invalidar caché
        invalidateCache('inventario');

        res.json({
            success: true,
            message: 'Item eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar item:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar item',
            error: error.message
        });
    }
};

// Actualizar stock
const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad, operacion } = req.body; // operacion: 'sumar' o 'restar'

        // Obtener item actual
        const { data: item, error: getError } = await supabase
            .from('inventario')
            .select('stock_actual')
            .eq('id', id)
            .single();

        if (getError) throw getError;

        let nuevoStock = item.stock_actual;
        if (operacion === 'sumar') {
            nuevoStock += cantidad;
        } else if (operacion === 'restar') {
            nuevoStock -= cantidad;
            if (nuevoStock < 0) nuevoStock = 0;
        }

        const { data, error } = await supabase
            .from('inventario')
            .update({ stock_actual: nuevoStock })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché
        invalidateCache('inventario');

        res.json({
            success: true,
            message: 'Stock actualizado exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al actualizar stock:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar stock',
            error: error.message
        });
    }
};

// Obtener items con stock bajo
const getStockBajo = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inventario')
            .select('*')
            .filter('stock_actual', 'lte', 'stock_minimo')
            .eq('activo', true)
            .order('stock_actual', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener stock bajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener stock bajo',
            error: error.message
        });
    }
};

module.exports = {
    getInventario,
    getInventarioById,
    createInventario,
    updateInventario,
    deleteInventario,
    updateStock,
    getStockBajo
};
