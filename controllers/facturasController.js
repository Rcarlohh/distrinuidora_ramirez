const supabase = require('../config/supabase');
const { invalidateCache } = require('../config/cache');
const pdfGenerator = require('../utils/pdfGenerator');

// Obtener todas las facturas
const getFacturas = async (req, res) => {
    try {
        const { estado, proveedor_id } = req.query;

        let query = supabase
            .from('vista_facturas_completas')
            .select('*');

        if (estado) {
            query = query.eq('estado', estado);
        }

        if (proveedor_id) {
            query = query.eq('proveedor_id', proveedor_id);
        }

        const { data, error } = await query.order('fecha_factura', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener facturas',
            error: error.message
        });
    }
};

// Obtener factura por ID con detalles
const getFacturaById = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener factura
        const { data: factura, error: facturaError } = await supabase
            .from('facturas')
            .select(`
                *,
                proveedor:proveedores(*),
                orden:ordenes_compra(*)
            `)
            .eq('id', id)
            .single();

        if (facturaError) throw facturaError;

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: 'Factura no encontrada'
            });
        }

        // Obtener detalles
        const { data: detalles, error: detallesError } = await supabase
            .from('factura_detalles')
            .select('*')
            .eq('factura_id', id)
            .order('created_at', { ascending: true });

        if (detallesError) throw detallesError;

        res.json({
            success: true,
            data: {
                ...factura,
                detalles
            }
        });
    } catch (error) {
        console.error('Error al obtener factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener factura',
            error: error.message
        });
    }
};

// Crear factura con detalles
const createFactura = async (req, res) => {
    try {
        const { factura, detalles } = req.body;

        // Validar datos
        if (!factura || !detalles || detalles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos. Se requiere información de la factura y al menos un detalle'
            });
        }

        // Crear factura
        const { data: nuevaFactura, error: facturaError } = await supabase
            .from('facturas')
            .insert([factura])
            .select()
            .single();

        if (facturaError) throw facturaError;

        // Agregar factura_id a los detalles
        const detallesConFactura = detalles.map(detalle => ({
            ...detalle,
            factura_id: nuevaFactura.id
        }));

        // Crear detalles
        const { data: nuevosDetalles, error: detallesError } = await supabase
            .from('factura_detalles')
            .insert(detallesConFactura)
            .select();

        if (detallesError) throw detallesError;

        // 🔥 REDUCIR STOCK DIRECTAMENTE EN EL BACKEND
        console.log('📦 Reduciendo stock para factura...');
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
        invalidateCache('facturas');
        invalidateCache('inventario');

        res.status(201).json({
            success: true,
            message: 'Factura creada exitosamente',
            data: {
                ...nuevaFactura,
                detalles: nuevosDetalles
            }
        });
    } catch (error) {
        console.error('Error al crear factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear factura',
            error: error.message
        });
    }
};

// Actualizar factura
const updateFactura = async (req, res) => {
    try {
        const { id } = req.params;
        const facturaData = req.body;

        const { data, error } = await supabase
            .from('facturas')
            .update(facturaData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché
        invalidateCache('facturas');

        res.json({
            success: true,
            message: 'Factura actualizada exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al actualizar factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar factura',
            error: error.message
        });
    }
};

// Eliminar factura
const deleteFactura = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('facturas')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Invalidar caché
        invalidateCache('facturas');

        res.json({
            success: true,
            message: 'Factura eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar factura',
            error: error.message
        });
    }
};

// Generar PDF de factura
const generarPDFFactura = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener factura completa
        const { data: factura, error: facturaError } = await supabase
            .from('facturas')
            .select('*')
            .eq('id', id)
            .single();

        if (facturaError) throw facturaError;

        // Obtener proveedor
        const { data: proveedor } = await supabase
            .from('proveedores')
            .select('*')
            .eq('id', factura.proveedor_id)
            .single();

        // Obtener orden si existe
        let orden = null;
        if (factura.orden_id) {
            const { data } = await supabase
                .from('ordenes_compra')
                .select('*')
                .eq('id', factura.orden_id)
                .single();
            orden = data;
        }

        // Obtener detalles
        const { data: detalles, error: detallesError } = await supabase
            .from('factura_detalles')
            .select('*')
            .eq('factura_id', id);

        if (detallesError) throw detallesError;

        // Generar PDF
        const { filepath, filename } = await pdfGenerator.generarFactura(factura, detalles, proveedor, orden);

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
    getFacturas,
    getFacturaById,
    createFactura,
    updateFactura,
    deleteFactura,
    generarPDFFactura
};
