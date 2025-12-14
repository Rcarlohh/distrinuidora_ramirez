-- ============================================
-- FIX CORRECTO: Órdenes de Compra REDUCEN Stock
-- ============================================
-- IMPORTANTE: Orden de Compra = Venta a Cliente → REDUCE stock
-- ============================================

-- Agregar campo stock_disponible a orden_detalles
ALTER TABLE orden_detalles
ADD COLUMN IF NOT EXISTS stock_disponible INTEGER DEFAULT 0;

-- Agregar comentario
COMMENT ON COLUMN orden_detalles.stock_disponible IS 'Stock disponible al momento de crear la orden';

-- Crear índice para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_orden_detalles_inventario ON orden_detalles(inventario_id);

-- ============================================
-- FUNCIÓN: REDUCIR stock al crear orden de compra (VENTA)
-- ============================================

CREATE OR REPLACE FUNCTION reducir_stock_orden()
RETURNS TRIGGER AS $$
BEGIN
    -- Reducir stock cuando se crea una orden (es una venta)
    IF NEW.inventario_id IS NOT NULL AND NEW.cantidad > 0 THEN
        UPDATE inventario
        SET 
            stock_actual = stock_actual - NEW.cantidad,
            updated_at = NOW()
        WHERE id = NEW.inventario_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Reducir stock cuando se crea un detalle de orden
-- ============================================

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_reducir_stock_orden ON orden_detalles;

-- Crear el trigger correcto
CREATE TRIGGER trigger_reducir_stock_orden
    AFTER INSERT ON orden_detalles
    FOR EACH ROW
    EXECUTE FUNCTION reducir_stock_orden();

-- ============================================
-- FUNCIÓN: Restaurar stock si se elimina un detalle
-- ============================================

CREATE OR REPLACE FUNCTION restaurar_stock_orden()
RETURNS TRIGGER AS $$
BEGIN
    -- Restaurar stock cuando se elimina un detalle de orden
    IF OLD.inventario_id IS NOT NULL AND OLD.cantidad > 0 THEN
        UPDATE inventario
        SET 
            stock_actual = stock_actual + OLD.cantidad,
            updated_at = NOW()
        WHERE id = OLD.inventario_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para restaurar stock al eliminar
DROP TRIGGER IF EXISTS trigger_restaurar_stock_orden ON orden_detalles;

CREATE TRIGGER trigger_restaurar_stock_orden
    AFTER DELETE ON orden_detalles
    FOR EACH ROW
    EXECUTE FUNCTION restaurar_stock_orden();

-- ============================================
-- ELIMINAR TRIGGERS INCORRECTOS ANTERIORES
-- ============================================

DROP TRIGGER IF EXISTS trigger_aumentar_stock_orden ON orden_detalles;
DROP TRIGGER IF EXISTS trigger_stock_estado_orden ON ordenes_compra;
DROP FUNCTION IF EXISTS aumentar_stock_orden();
DROP FUNCTION IF EXISTS actualizar_stock_por_estado_orden();

-- ============================================
-- DATOS DE EJEMPLO ACTUALIZADOS
-- ============================================

-- Insertar productos de ejemplo con stock inicial
INSERT INTO inventario (
    codigo, 
    numero_parte,
    nombre, 
    descripcion, 
    categoria, 
    precio_unitario, 
    stock_actual, 
    stock_minimo, 
    unidad_medida,
    clave_producto_sat,
    clave_unidad_sat,
    marca,
    modelo_aplicacion,
    especificacion,
    objeto_impuesto,
    tasa_iva
) VALUES 
(
    'BAL-DEL-01',
    'BRK-FRT-001',
    'Balatas Delanteras',
    'Balatas Delanteras Brembo para Nissan Versa 2015-2020',
    'Frenos',
    450.00,
    20,
    5,
    'JGO',
    '25172500',
    'H87',
    'BREMBO',
    'Nissan Versa 2015-2020',
    'Juego completo, incluye sensores de desgaste',
    '02',
    0.16
),
(
    'BUJ-MOT-01',
    'NGK-6619',
    'Bujías NGK',
    'Bujías NGK Iridium IX para Motor Gasolina',
    'Motor',
    125.00,
    40,
    10,
    'PZA',
    '25172500',
    'H87',
    'NGK',
    'Universal - Motores Gasolina 4 cilindros',
    'Iridium, mayor duración y rendimiento',
    '02',
    0.16
),
(
    'BAT-12V-01',
    'LTH-L-48R-600',
    'Batería LTH 12V',
    'Batería LTH 12V 600A para Automóvil',
    'Eléctrico',
    1850.00,
    8,
    2,
    'PZA',
    '26111700',
    'H87',
    'LTH',
    'Universal - Autos medianos',
    '12V, 600A arranque en frío, garantía 12 meses',
    '02',
    0.16
)
ON CONFLICT (codigo) DO UPDATE SET
    numero_parte = EXCLUDED.numero_parte,
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    categoria = EXCLUDED.categoria,
    precio_unitario = EXCLUDED.precio_unitario,
    stock_actual = EXCLUDED.stock_actual,
    stock_minimo = EXCLUDED.stock_minimo,
    marca = EXCLUDED.marca,
    modelo_aplicacion = EXCLUDED.modelo_aplicacion,
    especificacion = EXCLUDED.especificacion,
    clave_producto_sat = EXCLUDED.clave_producto_sat,
    clave_unidad_sat = EXCLUDED.clave_unidad_sat,
    objeto_impuesto = EXCLUDED.objeto_impuesto,
    tasa_iva = EXCLUDED.tasa_iva;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que los campos existen
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orden_detalles'
AND column_name IN ('inventario_id', 'codigo', 'numero_parte', 'stock_disponible')
ORDER BY ordinal_position;

-- Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('orden_detalles', 'factura_detalles')
ORDER BY event_object_table, trigger_name;

-- Ver stock actual de productos
SELECT 
    codigo,
    nombre,
    stock_actual,
    stock_minimo,
    CASE 
        WHEN stock_actual <= stock_minimo THEN 'BAJO'
        ELSE 'OK'
    END as estado_stock
FROM inventario
WHERE activo = true
ORDER BY codigo;
