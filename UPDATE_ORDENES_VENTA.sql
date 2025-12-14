-- ============================================
-- ACTUALIZAR ORDENES_COMPRA PARA VENTAS
-- ============================================

-- Agregar campos de cliente a ordenes_compra
ALTER TABLE ordenes_compra
ADD COLUMN IF NOT EXISTS nombre_cliente VARCHAR(255),
ADD COLUMN IF NOT EXISTS rfc_cliente VARCHAR(13),
ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50),
ADD COLUMN IF NOT EXISTS requiere_factura BOOLEAN DEFAULT false;

-- Comentarios
COMMENT ON COLUMN ordenes_compra.nombre_cliente IS 'Nombre del cliente que compra';
COMMENT ON COLUMN ordenes_compra.rfc_cliente IS 'RFC del cliente (opcional, solo si requiere factura)';
COMMENT ON COLUMN ordenes_compra.metodo_pago IS 'Método de pago: Efectivo, Tarjeta, Transferencia';
COMMENT ON COLUMN ordenes_compra.requiere_factura IS 'Si el cliente requiere factura';

-- Hacer proveedor_id opcional (ya que ahora es nombre_cliente)
ALTER TABLE ordenes_compra
ALTER COLUMN proveedor_id DROP NOT NULL;

-- Eliminar vista anterior si existe
DROP VIEW IF EXISTS vista_ordenes_completas;

-- Crear nueva vista de órdenes completas
CREATE VIEW vista_ordenes_completas AS
SELECT 
    o.id,
    o.numero_orden,
    o.fecha_orden,
    o.fecha_entrega,
    o.estado,
    o.subtotal,
    o.iva,
    o.total,
    o.nombre_cliente,
    o.rfc_cliente,
    o.metodo_pago,
    o.requiere_factura,
    o.notas,
    COALESCE(o.nombre_cliente, p.nombre_social) as cliente,
    p.nombre_social as proveedor_nombre,
    p.rfc as proveedor_rfc,
    p.contacto as proveedor_contacto,
    p.telefono as proveedor_telefono,
    o.created_at,
    o.updated_at
FROM ordenes_compra o
LEFT JOIN proveedores p ON o.proveedor_id = p.id
ORDER BY o.fecha_orden DESC;

-- Verificar cambios
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'ordenes_compra'
AND column_name IN ('nombre_cliente', 'rfc_cliente', 'metodo_pago', 'requiere_factura', 'proveedor_id')
ORDER BY ordinal_position;

-- Ver estructura de la vista
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vista_ordenes_completas'
ORDER BY ordinal_position;
