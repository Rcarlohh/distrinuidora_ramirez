const supabase = require('../config/supabase');
const { invalidateCache } = require('../config/cache');
const pdfGenerator = require('../utils/pdfGeneratorTrabajo');

// Obtener todas las órdenes de trabajo
const getOrdenesTrabajo = async (req, res) => {
    try {
        const { estado } = req.query;

        let query = supabase
            .from('ordenes_trabajo')
            .select('*');

        if (estado) {
            query = query.eq('estado', estado);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener órdenes de trabajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener órdenes de trabajo',
            error: error.message
        });
    }
};

// Obtener una orden de trabajo por ID con detalles
const getOrdenTrabajoById = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener orden
        const { data: orden, error: ordenError } = await supabase
            .from('ordenes_trabajo')
            .select('*')
            .eq('id', id)
            .single();

        if (ordenError) throw ordenError;

        if (!orden) {
            return res.status(404).json({
                success: false,
                message: 'Orden de trabajo no encontrada'
            });
        }

        // Obtener detalles
        const { data: detalles, error: detallesError } = await supabase
            .from('orden_trabajo_detalles')
            .select('*')
            .eq('orden_trabajo_id', id)
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
        console.error('Error al obtener orden de trabajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener orden de trabajo',
            error: error.message
        });
    }
};

// Crear orden de trabajo con detalles
const createOrdenTrabajo = async (req, res) => {
    try {
        const { orden, detalles } = req.body;

        // Validar datos
        if (!orden) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos. Se requiere información de la orden'
            });
        }

        // Crear orden
        const { data: nuevaOrden, error: ordenError } = await supabase
            .from('ordenes_trabajo')
            .insert([orden])
            .select()
            .single();

        if (ordenError) throw ordenError;

        // Si hay detalles, crearlos
        if (detalles && detalles.length > 0) {
            const detallesConOrden = detalles.map(detalle => ({
                ...detalle,
                orden_trabajo_id: nuevaOrden.id
            }));

            const { data: nuevosDetalles, error: detallesError } = await supabase
                .from('orden_trabajo_detalles')
                .insert(detallesConOrden)
                .select();

            if (detallesError) throw detallesError;

            // 🔥 REDUCIR STOCK DIRECTAMENTE EN EL BACKEND
            console.log('📦 Reduciendo stock para orden de trabajo...');
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

            nuevaOrden.detalles = nuevosDetalles;
        }

        // Invalidar caché
        invalidateCache('ordenes_trabajo');
        invalidateCache('inventario');

        res.status(201).json({
            success: true,
            message: 'Orden de trabajo creada exitosamente',
            data: nuevaOrden
        });
    } catch (error) {
        console.error('Error al crear orden de trabajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear orden de trabajo',
            error: error.message
        });
    }
};

// Actualizar orden de trabajo
const updateOrdenTrabajo = async (req, res) => {
    try {
        const { id } = req.params;
        const ordenData = req.body;

        const { data, error } = await supabase
            .from('ordenes_trabajo')
            .update(ordenData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché
        invalidateCache('ordenes_trabajo');

        res.json({
            success: true,
            message: 'Orden de trabajo actualizada exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al actualizar orden de trabajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar orden de trabajo',
            error: error.message
        });
    }
};

// Eliminar orden de trabajo
const deleteOrdenTrabajo = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('ordenes_trabajo')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Invalidar caché
        invalidateCache('ordenes_trabajo');

        res.json({
            success: true,
            message: 'Orden de trabajo eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar orden de trabajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar orden de trabajo',
            error: error.message
        });
    }
};

// Generar PDF de orden de trabajo
const generarPDFOrdenTrabajo = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener orden completa
        const { data: orden, error: ordenError } = await supabase
            .from('ordenes_trabajo')
            .select('*')
            .eq('id', id)
            .single();

        if (ordenError) throw ordenError;

        // Obtener detalles
        const { data: detalles, error: detallesError } = await supabase
            .from('orden_trabajo_detalles')
            .select('*')
            .eq('orden_trabajo_id', id);

        if (detallesError) throw detallesError;

        // Generar PDF
        const { filepath, filename } = await pdfGenerator.generarOrdenTrabajo(orden, detalles);

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
    getOrdenesTrabajo,
    getOrdenTrabajoById,
    createOrdenTrabajo,
    updateOrdenTrabajo,
    deleteOrdenTrabajo,
    generarPDFOrdenTrabajo
};
