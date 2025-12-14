-- ============================================
-- AGREGAR CAMPOS DE DIRECCIÓN Y TELÉFONO A FACTURAS
-- ============================================

-- Agregar campos adicionales del cliente a facturas
ALTER TABLE facturas
ADD COLUMN IF NOT EXISTS direccion_cliente TEXT,
ADD COLUMN IF NOT EXISTS telefono_cliente VARCHAR(20);

-- Comentarios
COMMENT ON COLUMN facturas.direccion_cliente IS 'Dirección completa del cliente';
COMMENT ON COLUMN facturas.telefono_cliente IS 'Teléfono del cliente';

-- Verificar cambios
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'facturas'
AND column_name IN ('nombre_cliente', 'rfc_cliente', 'direccion_cliente', 'telefono_cliente')
ORDER BY ordinal_position;
