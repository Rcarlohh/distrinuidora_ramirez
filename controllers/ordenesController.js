const supabase = require('../config/supabase');
const { invalidateCache } = require('../config/cache');
const pdfGenerator = require('../utils/pdfGenerator');

// Obtener todas las órdenes con información del proveedor
const getOrdenes = async (req, res) => {
    try {
        const { estado, proveedor_id } = req.query;

        let query = supabase
            .from('vista_ordenes_completas')
            .select('*');

        if (estado) {
            query = query.eq('estado', estado);
        }

        if (proveedor_id) {
            query = query.eq('proveedor_id', proveedor_id);
        }

        const { data, error } = await query.order('fecha_orden', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener órdenes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener órdenes',
            error: error.message
        });
    }
};

// Obtener una orden por ID con detalles
const getOrdenById = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener orden
        const { data: orden, error: ordenError } = await supabase
            .from('ordenes_compra')
            .select(`
                *,
                proveedor:proveedores(*)
            `)
            .eq('id', id)
            .single();

        if (ordenError) throw ordenError;

        if (!orden) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        // Obtener detalles
        const { data: detalles, error: detallesError } = await supabase
            .from('orden_detalles')
            .select('*')
            .eq('orden_id', id)
            .order('created_at', { ascending: true });

        if (detallesError) throw detallesError;

        res.json({
            success: true,
            data: {
                ...orden,
                detalles
            }
        });
    } catch (error) {
        console.error('Error al obtener orden:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener orden',
            error: error.message
        });
    }
};

// Crear orden de compra con detalles
const createOrden = async (req, res) => {
    try {
        const { orden, detalles } = req.body;

        // Validar datos
        if (!orden || !detalles || detalles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos. Se requiere información de la orden y al menos un detalle'
            });
        }

        // Crear orden
        const { data: nuevaOrden, error: ordenError } = await supabase
            .from('ordenes_compra')
            .insert([orden])
            .select()
            .single();

        if (ordenError) throw ordenError;

        // Agregar orden_id a los detalles
        const detallesConOrden = detalles.map(detalle => ({
            ...detalle,
            orden_id: nuevaOrden.id
        }));

        // Crear detalles
        const { data: nuevosDetalles, error: detallesError } = await supabase
            .from('orden_detalles')
            .insert(detallesConOrden)
            .select();

        if (detallesError) throw detallesError;

        // 🔥 REDUCIR STOCK DIRECTAMENTE EN EL BACKEND
        console.log('📦 Reduciendo stock para', detalles.length, 'productos...');
        for (const detalle of detalles) {
            if (detalle.inventario_id && detalle.cantidad > 0) {
                console.log(`  → Producto ${detalle.inventario_id}: -${detalle.cantidad} unidades`);

                // Obtener stock actual
                const { data: productoActual, error: fetchError } = await supabase
                    .from('inventario')
                    .select('stock_actual')
                    .eq('id', detalle.inventario_id)
                    .single();

                if (fetchError) {
                    console.error('❌ Error al obtener producto:', fetchError);
                    continue;
                }

                if (productoActual) {
                    const nuevoStock = productoActual.stock_actual - parseInt(detalle.cantidad);

                    // Actualizar stock
                    const { error: stockError } = await supabase
                        .from('inventario')
                        .update({
                            stock_actual: nuevoStock,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', detalle.inventario_id);

                    if (stockError) {
                        console.error('❌ Error al reducir stock:', stockError);
                    } else {
                        console.log(`  ✅ Stock reducido: ${productoActual.stock_actual} → ${nuevoStock}`);
                    }
                }
            }
        }

        // Invalidar caché
        invalidateCache('ordenes');
        invalidateCache('inventario');

        res.status(201).json({
            success: true,
            message: 'Orden creada exitosamente',
            data: {
                ...nuevaOrden,
                detalles: nuevosDetalles
            }
        });
    } catch (error) {
        console.error('Error al crear orden:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear orden',
            error: error.message
        });
    }
};

// Actualizar orden
const updateOrden = async (req, res) => {
    try {
        const { id } = req.params;
        const ordenData = req.body;

        const { data, error } = await supabase
            .from('ordenes_compra')
            .update(ordenData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché
        invalidateCache('ordenes');

        res.json({
            success: true,
            message: 'Orden actualizada exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al actualizar orden:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar orden',
            error: error.message
        });
    }
};

// Eliminar orden
const deleteOrden = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('ordenes_compra')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Invalidar caché
        invalidateCache('ordenes');

        res.json({
            success: true,
            message: 'Orden eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar orden:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar orden',
            error: error.message
        });
    }
};

// Generar PDF de orden
const generarPDFOrden = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener orden completa
        const { data: orden, error: ordenError } = await supabase
            .from('ordenes_compra')
            .select('*')
            .eq('id', id)
            .single();

        if (ordenError) throw ordenError;

        // Obtener proveedor
        const { data: proveedor } = await supabase
            .from('proveedores')
            .select('*')
            .eq('id', orden.proveedor_id)
            .single();

        // Obtener detalles
        const { data: detalles, error: detallesError } = await supabase
            .from('orden_detalles')
            .select('*')
            .eq('orden_id', id);

        if (detallesError) throw detallesError;

        // Generar PDF
        const { filepath, filename } = await pdfGenerator.generarOrdenCompra(orden, detalles, proveedor);

        // Enviar archivo
        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('Error al enviar PDF:', err);
            }
        });

    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar PDF',
            error: error.message
        });
    }
};

module.exports = {
    getOrdenes,
    getOrdenById,
    createOrden,
    updateOrden,
    deleteOrden,
    generarPDFOrden
};
