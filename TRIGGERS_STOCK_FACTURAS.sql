-- ============================================
-- TRIGGERS DE STOCK PARA FACTURAS
-- ============================================

-- FUNCIÓN: REDUCIR stock al crear factura
CREATE OR REPLACE FUNCTION reducir_stock_factura()
RETURNS TRIGGER AS $$
BEGIN
    -- Reducir stock cuando se crea un detalle de factura
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

-- TRIGGER: Reducir stock cuando se crea un detalle de factura
DROP TRIGGER IF EXISTS trigger_reducir_stock_factura ON factura_detalles;

CREATE TRIGGER trigger_reducir_stock_factura
    AFTER INSERT ON factura_detalles
    FOR EACH ROW
    EXECUTE FUNCTION reducir_stock_factura();

-- FUNCIÓN: Restaurar stock si se elimina un detalle de factura
CREATE OR REPLACE FUNCTION restaurar_stock_factura()
RETURNS TRIGGER AS $$
BEGIN
    -- Restaurar stock cuando se elimina un detalle de factura
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

-- Trigger para restaurar stock al eliminar detalle de factura
DROP TRIGGER IF EXISTS trigger_restaurar_stock_factura ON factura_detalles;

CREATE TRIGGER trigger_restaurar_stock_factura
    AFTER DELETE ON factura_detalles
    FOR EACH ROW
    EXECUTE FUNCTION restaurar_stock_factura();

-- ============================================
-- VERIFICAR TRIGGERS ACTIVOS
-- ============================================

SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('orden_detalles', 'factura_detalles')
ORDER BY event_object_table, trigger_name;

-- ============================================
-- PRUEBA DE STOCK
-- ============================================

-- Ver stock actual
SELECT 
    id,
    codigo,
    nombre,
    stock_actual,
    stock_minimo,
    CASE 
        WHEN stock_actual <= 0 THEN '🔴 AGOTADO'
        WHEN stock_actual <= stock_minimo THEN '🟡 BAJO'
        ELSE '🟢 OK'
    END as estado
FROM inventario
WHERE activo = true
ORDER BY stock_actual ASC;
