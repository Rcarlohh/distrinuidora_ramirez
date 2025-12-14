-- ============================================
-- ACTUALIZAR FACTURAS PARA DATOS DE CLIENTE
-- ============================================

-- Agregar campos de cliente a facturas
ALTER TABLE facturas
ADD COLUMN IF NOT EXISTS nombre_cliente VARCHAR(255),
ADD COLUMN IF NOT EXISTS rfc_cliente VARCHAR(13);

-- Comentarios
COMMENT ON COLUMN facturas.nombre_cliente IS 'Nombre del cliente (cargado desde la orden)';
COMMENT ON COLUMN facturas.rfc_cliente IS 'RFC del cliente (cargado desde la orden)';

-- Hacer proveedor_id opcional (ya que ahora usamos nombre_cliente)
ALTER TABLE facturas
ALTER COLUMN proveedor_id DROP NOT NULL;

-- Verificar cambios
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'facturas'
AND column_name IN ('nombre_cliente', 'rfc_cliente', 'proveedor_id', 'orden_id')
ORDER BY ordinal_position;

-- Ver estructura completa de facturas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'facturas'
ORDER BY ordinal_position;
