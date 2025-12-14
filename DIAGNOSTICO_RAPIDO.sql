-- ============================================
-- DIAGNÓSTICO RÁPIDO: ¿Por qué no baja el stock?
-- ============================================
-- Ejecuta este script completo en Supabase SQL Editor
-- Te dirá exactamente qué falta

-- ============================================
-- 1. VERIFICAR ESTRUCTURA DE TABLAS
-- ============================================

SELECT '=== 1. VERIFICAR CAMPOS DE orden_detalles ===' as seccion;

SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'inventario_id' THEN '✅ CAMPO CRÍTICO PARA STOCK'
        WHEN column_name = 'codigo' THEN '✅ CAMPO OPCIONAL'
        WHEN column_name = 'stock_disponible' THEN '✅ CAMPO OPCIONAL'
        ELSE ''
    END as importancia
FROM information_schema.columns
WHERE table_name = 'orden_detalles'
ORDER BY ordinal_position;

-- ============================================
-- 2. VERIFICAR TRIGGERS
-- ============================================

SELECT '=== 2. VERIFICAR TRIGGERS DE STOCK ===' as seccion;

SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    CASE 
        WHEN trigger_name LIKE '%reducir_stock%' THEN '🔴 CRÍTICO - Reduce stock al crear'
        WHEN trigger_name LIKE '%restaurar_stock%' THEN '🟡 IMPORTANTE - Restaura stock al eliminar'
        ELSE '⚪ Otro trigger'
    END as tipo
FROM information_schema.triggers
WHERE event_object_table IN ('orden_detalles', 'factura_detalles')
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 3. VERIFICAR FUNCIONES
-- ============================================

SELECT '=== 3. VERIFICAR FUNCIONES DE STOCK ===' as seccion;

SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name LIKE '%reducir_stock%' THEN '🔴 CRÍTICA'
        WHEN routine_name LIKE '%restaurar_stock%' THEN '🟡 IMPORTANTE'
        ELSE '⚪ Otra'
    END as importancia
FROM information_schema.routines
WHERE routine_name LIKE '%stock%'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================
-- 4. VERIFICAR DATOS RECIENTES
-- ============================================

SELECT '=== 4. ÚLTIMAS ÓRDENES (inventario_id debe tener UUID) ===' as seccion;

SELECT 
    o.numero_orden,
    o.nombre_cliente,
    o.created_at,
    od.material_servicio,
    od.cantidad,
    od.inventario_id,
    CASE 
        WHEN od.inventario_id IS NULL THEN '❌ NULL - NO reducirá stock'
        ELSE '✅ Tiene UUID - SÍ reducirá stock'
    END as estado_inventario_id,
    i.codigo as codigo_producto,
    i.stock_actual
FROM ordenes_compra o
JOIN orden_detalles od ON o.id = od.orden_id
LEFT JOIN inventario i ON od.inventario_id = i.id
ORDER BY o.created_at DESC
LIMIT 10;

-- ============================================
-- 5. RESUMEN DE DIAGNÓSTICO
-- ============================================

SELECT '=== 5. RESUMEN DE DIAGNÓSTICO ===' as seccion;

SELECT 
    '1. Campo inventario_id existe en orden_detalles' as verificacion,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'orden_detalles' AND column_name = 'inventario_id'
        ) THEN '✅ SÍ'
        ELSE '❌ NO - EJECUTA: UPDATE_INVENTARIO_SAT.sql'
    END as resultado,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'orden_detalles' AND column_name = 'inventario_id'
        ) THEN 'OK'
        ELSE 'CRÍTICO'
    END as prioridad

UNION ALL

SELECT 
    '2. Trigger reducir_stock_orden existe',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers
            WHERE event_object_table = 'orden_detalles' 
            AND trigger_name = 'trigger_reducir_stock_orden'
        ) THEN '✅ SÍ'
        ELSE '❌ NO - EJECUTA: FIX_STOCK_CORRECTO.sql'
    END,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers
            WHERE event_object_table = 'orden_detalles' 
            AND trigger_name = 'trigger_reducir_stock_orden'
        ) THEN 'OK'
        ELSE 'CRÍTICO'
    END

UNION ALL

SELECT 
    '3. Trigger restaurar_stock_orden existe',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers
            WHERE event_object_table = 'orden_detalles' 
            AND trigger_name = 'trigger_restaurar_stock_orden'
        ) THEN '✅ SÍ'
        ELSE '❌ NO - EJECUTA: FIX_STOCK_CORRECTO.sql'
    END,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers
            WHERE event_object_table = 'orden_detalles' 
            AND trigger_name = 'trigger_restaurar_stock_orden'
        ) THEN 'OK'
        ELSE 'IMPORTANTE'
    END

UNION ALL

SELECT 
    '4. Función reducir_stock_venta() existe',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_name = 'reducir_stock_venta'
        ) THEN '✅ SÍ'
        ELSE '❌ NO - EJECUTA: FIX_STOCK_CORRECTO.sql'
    END,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_name = 'reducir_stock_venta'
        ) THEN 'OK'
        ELSE 'CRÍTICO'
    END

UNION ALL

SELECT 
    '5. Función restaurar_stock_venta() existe',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_name = 'restaurar_stock_venta'
        ) THEN '✅ SÍ'
        ELSE '❌ NO - EJECUTA: FIX_STOCK_CORRECTO.sql'
    END,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_name = 'restaurar_stock_venta'
        ) THEN 'OK'
        ELSE 'IMPORTANTE'
    END

UNION ALL

SELECT 
    '6. Últimas órdenes tienen inventario_id',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM orden_detalles
            WHERE inventario_id IS NOT NULL
            LIMIT 1
        ) THEN '✅ SÍ - Usa el Selector de Inventario'
        ELSE '⚠️ NO - Asegúrate de usar el Selector de Inventario'
    END,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM orden_detalles
            WHERE inventario_id IS NOT NULL
            LIMIT 1
        ) THEN 'OK'
        ELSE 'ADVERTENCIA'
    END;

-- ============================================
-- 6. STOCK ACTUAL DEL INVENTARIO
-- ============================================

SELECT '=== 6. ESTADO DEL INVENTARIO ===' as seccion;

SELECT 
    codigo,
    nombre,
    stock_actual,
    stock_minimo,
    CASE 
        WHEN stock_actual <= 0 THEN '🔴 AGOTADO'
        WHEN stock_actual <= stock_minimo THEN '🟡 BAJO'
        WHEN stock_actual <= stock_minimo * 2 THEN '🟠 MEDIO'
        ELSE '🟢 OK'
    END as estado,
    precio_unitario,
    categoria
FROM inventario
WHERE activo = true
ORDER BY 
    CASE 
        WHEN stock_actual <= 0 THEN 1
        WHEN stock_actual <= stock_minimo THEN 2
        WHEN stock_actual <= stock_minimo * 2 THEN 3
        ELSE 4
    END,
    stock_actual ASC
LIMIT 20;

-- ============================================
-- 7. INSTRUCCIONES FINALES
-- ============================================

SELECT '=== 7. INSTRUCCIONES ===' as seccion;

SELECT 
    'Si ves ❌ en el RESUMEN DE DIAGNÓSTICO:' as instruccion,
    '1. Ejecuta los scripts SQL indicados en Supabase' as paso_1,
    '2. Vuelve a ejecutar este diagnóstico' as paso_2,
    '3. Todos deben estar en ✅' as paso_3,
    '4. Crea una orden de prueba usando el Selector de Inventario' as paso_4,
    '5. Verifica que el stock se redujo' as paso_5;
