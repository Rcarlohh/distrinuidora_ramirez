const supabase = require('../config/supabase');
const { invalidateCache } = require('../config/cache');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar almacenamiento de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/facturas');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `factura-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.xml'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'));
        }
    }
});

// Obtener todas las facturas
const getFacturas = async (req, res) => {
    try {
        const { estado } = req.query;

        let query = supabase
            .from('facturas_documentos')
            .select('*');

        if (estado) {
            query = query.eq('estado', estado);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
            count: data ? data.length : 0
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

// Obtener factura por ID
const getFacturaById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: factura, error } = await supabase
            .from('facturas_documentos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: 'Factura no encontrada'
            });
        }

        res.json({
            success: true,
            data: factura
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

// Crear factura (con archivo)
const createFactura = async (req, res) => {
    try {
        const {
            nombre_documento,
            proveedor,
            numero_factura,
            fecha_factura,
            monto,
            notas,
            estado
        } = req.body;

        // URL del archivo si se subió
        let archivo_url = null;
        let archivo_nombre = null;

        if (req.file) {
            archivo_nombre = req.file.filename;
            archivo_url = `/uploads/facturas/${req.file.filename}`;
        }

        const { data: nuevaFactura, error } = await supabase
            .from('facturas_documentos')
            .insert([{
                nombre_documento,
                proveedor,
                numero_factura,
                fecha_factura: fecha_factura || null,
                monto: monto ? parseFloat(monto) : null,
                notas,
                estado: estado || 'En Proceso',
                archivo_url,
                archivo_nombre
            }])
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché
        invalidateCache('facturas');

        res.status(201).json({
            success: true,
            message: 'Factura cargada exitosamente',
            data: nuevaFactura
        });
    } catch (error) {
        console.error('Error al crear factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar factura',
            error: error.message
        });
    }
};

// Actualizar factura
const updateFactura = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre_documento,
            proveedor,
            numero_factura,
            fecha_factura,
            monto,
            notas,
            estado
        } = req.body;

        const updateData = {
            nombre_documento,
            proveedor,
            numero_factura,
            fecha_factura: fecha_factura || null,
            monto: monto ? parseFloat(monto) : null,
            notas,
            estado,
            updated_at: new Date().toISOString()
        };

        // Si se sube nuevo archivo
        if (req.file) {
            updateData.archivo_nombre = req.file.filename;
            updateData.archivo_url = `/uploads/facturas/${req.file.filename}`;
        }

        const { data, error } = await supabase
            .from('facturas_documentos')
            .update(updateData)
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

        // Obtener factura para eliminar archivo
        const { data: factura } = await supabase
            .from('facturas_documentos')
            .select('archivo_nombre')
            .eq('id', id)
            .single();

        // Eliminar archivo si existe
        if (factura && factura.archivo_nombre) {
            const filePath = path.join(__dirname, '../uploads/facturas', factura.archivo_nombre);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        const { error } = await supabase
            .from('facturas_documentos')
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

// Descargar archivo de factura
const downloadFactura = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: factura, error } = await supabase
            .from('facturas_documentos')
            .select('archivo_nombre, archivo_url')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!factura || !factura.archivo_nombre) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado'
            });
        }

        const filePath = path.join(__dirname, '../uploads/facturas', factura.archivo_nombre);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado en el servidor'
            });
        }

        res.download(filePath, factura.archivo_nombre);
    } catch (error) {
        console.error('Error al descargar factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error al descargar factura',
            error: error.message
        });
    }
};

module.exports = {
    upload,
    getFacturas,
    getFacturaById,
    createFactura,
    updateFactura,
    deleteFactura,
    downloadFactura
};
