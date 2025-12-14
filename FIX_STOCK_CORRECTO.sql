-- ============================================
-- CORRECCIÓN FINAL: Stock debe REDUCIRSE en ventas
-- ============================================

-- ELIMINAR TRIGGERS ANTERIORES
DROP TRIGGER IF EXISTS trigger_reducir_stock_orden ON orden_detalles;
DROP TRIGGER IF EXISTS trigger_restaurar_stock_orden ON orden_detalles;
DROP TRIGGER IF EXISTS trigger_reducir_stock_factura ON factura_detalles;
DROP TRIGGER IF EXISTS trigger_restaurar_stock_factura ON factura_detalles;

-- ELIMINAR FUNCIONES ANTERIORES
DROP FUNCTION IF EXISTS reducir_stock_orden();
DROP FUNCTION IF EXISTS restaurar_stock_orden();
DROP FUNCTION IF EXISTS reducir_stock_factura();
DROP FUNCTION IF EXISTS restaurar_stock_factura();

-- ============================================
-- FUNCIÓN CORRECTA: REDUCIR stock (RESTAR)
-- ============================================

CREATE OR REPLACE FUNCTION reducir_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
    -- REDUCIR stock cuando se crea una venta (RESTAR)
    IF NEW.inventario_id IS NOT NULL AND NEW.cantidad > 0 THEN
        UPDATE inventario
        SET 
            stock_actual = stock_actual - NEW.cantidad,  -- RESTAR (-)
            updated_at = NOW()
        WHERE id = NEW.inventario_id;
        
        RAISE NOTICE 'Stock reducido: Producto %, Cantidad -%', NEW.inventario_id, NEW.cantidad;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN CORRECTA: RESTAURAR stock (SUMAR)
-- ============================================

CREATE OR REPLACE FUNCTION restaurar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
    -- RESTAURAR stock cuando se elimina una venta (SUMAR)
    IF OLD.inventario_id IS NOT NULL AND OLD.cantidad > 0 THEN
        UPDATE inventario
        SET 
            stock_actual = stock_actual + OLD.cantidad,  -- SUMAR (+)
            updated_at = NOW()
        WHERE id = OLD.inventario_id;
        
        RAISE NOTICE 'Stock restaurado: Producto %, Cantidad +%', OLD.inventario_id, OLD.cantidad;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS PARA ÓRDENES DE COMPRA (VENTAS)
-- ============================================

CREATE TRIGGER trigger_reducir_stock_orden
    AFTER INSERT ON orden_detalles
    FOR EACH ROW
    EXECUTE FUNCTION reducir_stock_venta();

CREATE TRIGGER trigger_restaurar_stock_orden
    AFTER DELETE ON orden_detalles
    FOR EACH ROW
    EXECUTE FUNCTION restaurar_stock_venta();

-- ============================================
-- TRIGGERS PARA FACTURAS (VENTAS)
-- ============================================

CREATE TRIGGER trigger_reducir_stock_factura
    AFTER INSERT ON factura_detalles
    FOR EACH ROW
    EXECUTE FUNCTION reducir_stock_venta();

CREATE TRIGGER trigger_restaurar_stock_factura
    AFTER DELETE ON factura_detalles
    FOR EACH ROW
    EXECUTE FUNCTION restaurar_stock_venta();

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver triggers creados
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('orden_detalles', 'factura_detalles')
ORDER BY event_object_table, trigger_name;

-- Ver stock actual
SELECT 
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
ORDER BY codigo;

-- ============================================
-- PRUEBA RÁPIDA
-- ============================================

-- 1. Ver stock de un producto
SELECT codigo, nombre, stock_actual 
FROM inventario 
WHERE codigo = 'BAL-DEL-01';

-- 2. Crear una venta con ese producto (cantidad: 2)
-- 3. Ejecutar de nuevo:
SELECT codigo, nombre, stock_actual 
FROM inventario 
WHERE codigo = 'BAL-DEL-01';

-- El stock debe haber BAJADO 2 unidades ✅
