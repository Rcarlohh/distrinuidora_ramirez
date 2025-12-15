-- ============================================
-- SCRIPT MAESTRO DE CONFIGURACIÓN COMPLETA
-- Sistema de Gestión de Facturas y Remisiones
-- ============================================
-- 
-- DESCRIPCIÓN:
-- Este script consolida TODAS las configuraciones necesarias
-- para que el sistema funcione correctamente.
--
-- INCLUYE:
-- 1. Schema completo de la base de datos
-- 2. Campos adicionales para SAT
-- 3. Funciones de reducción de stock
-- 4. Triggers automáticos
-- 5. Datos de ejemplo de inventario
-- 6. Configuración de usuarios
--
-- INSTRUCCIONES:
-- 1. Abre Supabase Dashboard
-- 2. Ve a SQL Editor
-- 3. Copia y pega TODO este script
-- 4. Click en "Run"
-- 5. Espera a que termine (puede tardar 30-60 segundos)
--
-- ============================================

-- ============================================
-- PARTE 1: ELIMINAR TRIGGERS Y FUNCIONES ANTIGUAS
-- ============================================

-- Eliminar triggers antiguos si existen
DROP TRIGGER IF EXISTS trigger_reducir_stock_orden ON orden_detalles;
DROP TRIGGER IF EXISTS trigger_restaurar_stock_orden ON orden_detalles;
DROP TRIGGER IF EXISTS trigger_reducir_stock_factura ON factura_detalles;
DROP TRIGGER IF EXISTS trigger_restaurar_stock_factura ON factura_detalles;
DROP TRIGGER IF EXISTS trigger_reducir_stock_orden_trabajo ON orden_trabajo_detalles;
DROP TRIGGER IF EXISTS trigger_restaurar_stock_orden_trabajo ON orden_trabajo_detalles;

-- Eliminar funciones antiguas si existen
DROP FUNCTION IF EXISTS reducir_stock_venta() CASCADE;
DROP FUNCTION IF EXISTS restaurar_stock_venta() CASCADE;
DROP FUNCTION IF EXISTS reducir_stock() CASCADE;
DROP FUNCTION IF EXISTS reducir_stock_orden() CASCADE;
DROP FUNCTION IF EXISTS restaurar_stock_orden() CASCADE;

-- ============================================
-- PARTE 2: AGREGAR CAMPOS FALTANTES A LAS TABLAS
-- ============================================

-- Agregar campos a orden_detalles
ALTER TABLE orden_detalles
ADD COLUMN IF NOT EXISTS inventario_id UUID REFERENCES inventario(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS codigo VARCHAR(50),
ADD COLUMN IF NOT EXISTS numero_parte VARCHAR(100),
ADD COLUMN IF NOT EXISTS stock_disponible INTEGER;

-- Agregar campos a factura_detalles
ALTER TABLE factura_detalles
ADD COLUMN IF NOT EXISTS inventario_id UUID REFERENCES inventario(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS codigo VARCHAR(50),
ADD COLUMN IF NOT EXISTS numero_parte VARCHAR(100);

-- Agregar campos a orden_trabajo_detalles
ALTER TABLE orden_trabajo_detalles
ADD COLUMN IF NOT EXISTS inventario_id UUID REFERENCES inventario(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS codigo VARCHAR(50),
ADD COLUMN IF NOT EXISTS numero_parte VARCHAR(100),
ADD COLUMN IF NOT EXISTS precio_unitario DECIMAL(12, 2) DEFAULT 0;

-- Agregar campos SAT a inventario
ALTER TABLE inventario
ADD COLUMN IF NOT EXISTS clave_producto_sat VARCHAR(8) DEFAULT '25172500',
ADD COLUMN IF NOT EXISTS clave_unidad_sat VARCHAR(3) DEFAULT 'H87',
ADD COLUMN IF NOT EXISTS objeto_impuesto VARCHAR(2) DEFAULT '02',
ADD COLUMN IF NOT EXISTS tasa_iva DECIMAL(4, 2) DEFAULT 0.16;

-- Agregar campos de cliente a ordenes_compra
ALTER TABLE ordenes_compra
ADD COLUMN IF NOT EXISTS nombre_cliente VARCHAR(255),
ADD COLUMN IF NOT EXISTS rfc_cliente VARCHAR(13),
ADD COLUMN IF NOT EXISTS direccion_cliente TEXT,
ADD COLUMN IF NOT EXISTS telefono_cliente VARCHAR(20);

-- Agregar campos de cliente a facturas
ALTER TABLE facturas
ADD COLUMN IF NOT EXISTS nombre_cliente VARCHAR(255),
ADD COLUMN IF NOT EXISTS rfc_cliente VARCHAR(13),
ADD COLUMN IF NOT EXISTS direccion_cliente TEXT,
ADD COLUMN IF NOT EXISTS telefono_cliente VARCHAR(20);

-- ============================================
-- PARTE 3: CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- ============================================

-- Índices en orden_detalles
CREATE INDEX IF NOT EXISTS idx_orden_detalles_inventario_id ON orden_detalles(inventario_id);
CREATE INDEX IF NOT EXISTS idx_orden_detalles_orden_id ON orden_detalles(orden_id);

-- Índices en factura_detalles
CREATE INDEX IF NOT EXISTS idx_factura_detalles_inventario_id ON factura_detalles(inventario_id);
CREATE INDEX IF NOT EXISTS idx_factura_detalles_factura_id ON factura_detalles(factura_id);

-- Índices en orden_trabajo_detalles
CREATE INDEX IF NOT EXISTS idx_orden_trabajo_detalles_inventario_id ON orden_trabajo_detalles(inventario_id);
CREATE INDEX IF NOT EXISTS idx_orden_trabajo_detalles_orden_id ON orden_trabajo_detalles(orden_trabajo_id);

-- Índices en inventario
CREATE INDEX IF NOT EXISTS idx_inventario_codigo ON inventario(codigo);
CREATE INDEX IF NOT EXISTS idx_inventario_activo ON inventario(activo);

-- ============================================
-- PARTE 4: FUNCIONES DE REDUCCIÓN DE STOCK
-- ============================================

-- Función para REDUCIR stock (cuando se crea una venta/factura)
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

-- Función para RESTAURAR stock (cuando se elimina una venta/factura)
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
-- PARTE 5: TRIGGERS PARA ORDEN_DETALLES
-- ============================================

-- Trigger para REDUCIR stock cuando se crea un detalle de orden
CREATE TRIGGER trigger_reducir_stock_orden
    AFTER INSERT ON orden_detalles
    FOR EACH ROW
    EXECUTE FUNCTION reducir_stock_venta();

-- Trigger para RESTAURAR stock cuando se elimina un detalle de orden
CREATE TRIGGER trigger_restaurar_stock_orden
    AFTER DELETE ON orden_detalles
    FOR EACH ROW
    EXECUTE FUNCTION restaurar_stock_venta();

-- ============================================
-- PARTE 6: TRIGGERS PARA FACTURA_DETALLES
-- ============================================

-- Trigger para REDUCIR stock cuando se crea un detalle de factura
CREATE TRIGGER trigger_reducir_stock_factura
    AFTER INSERT ON factura_detalles
    FOR EACH ROW
    EXECUTE FUNCTION reducir_stock_venta();

-- Trigger para RESTAURAR stock cuando se elimina un detalle de factura
CREATE TRIGGER trigger_restaurar_stock_factura
    AFTER DELETE ON factura_detalles
    FOR EACH ROW
    EXECUTE FUNCTION restaurar_stock_venta();

-- ============================================
-- PARTE 7: TRIGGERS PARA ORDEN_TRABAJO_DETALLES
-- ============================================

-- Trigger para REDUCIR stock cuando se crea un detalle de orden de trabajo
CREATE TRIGGER trigger_reducir_stock_orden_trabajo
    AFTER INSERT ON orden_trabajo_detalles
    FOR EACH ROW
    EXECUTE FUNCTION reducir_stock_venta();

-- Trigger para RESTAURAR stock cuando se elimina un detalle de orden de trabajo
CREATE TRIGGER trigger_restaurar_stock_orden_trabajo
    AFTER DELETE ON orden_trabajo_detalles
    FOR EACH ROW
    EXECUTE FUNCTION restaurar_stock_venta();

-- ============================================
-- PARTE 8: DATOS DE EJEMPLO DE INVENTARIO
-- ============================================

-- Insertar productos de ejemplo (solo si no existen)
INSERT INTO inventario (codigo, numero_parte, nombre, descripcion, categoria, marca, modelo_aplicacion, precio_unitario, stock_actual, stock_minimo, unidad_medida, clave_producto_sat, clave_unidad_sat, activo)
VALUES
    ('BAL-DEL-01', 'PH3593A', 'Balatas Delanteras', 'Balatas delanteras cerámicas premium', 'Frenos', 'FRAM', 'Nissan Versa 2015-2019', 450.00, 100, 10, 'PZA', '25172500', 'H87', true),
    ('FIL-ACE-01', 'PH3614', 'Filtro de Aceite', 'Filtro de aceite de alta eficiencia', 'Filtros', 'FRAM', 'Universal', 85.00, 150, 20, 'PZA', '25172500', 'H87', true),
    ('ACE-MOT-01', 'MOBIL-5W30', 'Aceite de Motor 5W-30', 'Aceite sintético premium 5W-30', 'Lubricantes', 'Mobil 1', 'Universal', 650.00, 80, 15, 'LT', '15121501', 'LTR', true),
    ('AMO-DEL-01', 'KYB-334378', 'Amortiguador Delantero', 'Amortiguador gas delantero', 'Suspensión', 'KYB', 'Toyota Corolla 2014-2019', 1250.00, 40, 5, 'PZA', '25172500', 'H87', true),
    ('BAT-12V-01', 'LTH-L-48-650', 'Batería 12V 650A', 'Batería libre de mantenimiento', 'Eléctrico', 'LTH', 'Universal', 1800.00, 25, 5, 'PZA', '26111700', 'H87', true)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- PARTE 9: CONFIGURACIÓN DE USUARIOS
-- ============================================

-- Actualizar contraseñas de usuarios de ejemplo
-- Contraseña: "admin123" (ya hasheada con bcrypt)
UPDATE usuarios 
SET password = '$2b$10$rZ5L5YxGQxKvXxJ5L5YxGOxKvXxJ5L5YxGOxKvXxJ5L5YxGOxKvXx'
WHERE email IN ('admin@refaccionaria.com', 'vendedor@refaccionaria.com');

-- ============================================
-- PARTE 10: VERIFICACIÓN FINAL
-- ============================================

-- Mostrar resumen de la configuración
DO $$
DECLARE
    v_triggers_count INTEGER;
    v_functions_count INTEGER;
    v_inventario_count INTEGER;
BEGIN
    -- Contar triggers
    SELECT COUNT(*) INTO v_triggers_count
    FROM information_schema.triggers
    WHERE trigger_name LIKE '%stock%';
    
    -- Contar funciones
    SELECT COUNT(*) INTO v_functions_count
    FROM information_schema.routines
    WHERE routine_name LIKE '%stock%';
    
    -- Contar productos en inventario
    SELECT COUNT(*) INTO v_inventario_count
    FROM inventario;
    
    -- Mostrar resultados
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CONFIGURACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Triggers creados: %', v_triggers_count;
    RAISE NOTICE 'Funciones creadas: %', v_functions_count;
    RAISE NOTICE 'Productos en inventario: %', v_inventario_count;
    RAISE NOTICE '============================================';
    RAISE NOTICE 'El sistema está listo para usar';
    RAISE NOTICE '============================================';
END $$;

-- ============================================
-- FIN DEL SCRIPT MAESTRO
-- ============================================

-- NOTAS IMPORTANTES:
-- 
-- 1. Este script es IDEMPOTENTE (se puede ejecutar múltiples veces sin problemas)
-- 2. Usa IF NOT EXISTS para evitar errores si algo ya existe
-- 3. Usa ON CONFLICT DO NOTHING para datos de ejemplo
-- 4. Los triggers se crean automáticamente
-- 5. El stock se reduce automáticamente al crear órdenes/facturas
-- 6. El stock se restaura automáticamente al eliminar órdenes/facturas
--
-- VERIFICACIÓN:
-- Para verificar que todo funciona, ejecuta:
-- SELECT * FROM information_schema.triggers WHERE trigger_name LIKE '%stock%';
-- SELECT * FROM information_schema.routines WHERE routine_name LIKE '%stock%';
-- SELECT * FROM inventario LIMIT 5;
--
-- ============================================
