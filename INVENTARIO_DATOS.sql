-- ============================================
-- DATOS DE EJEMPLO PARA INVENTARIO
-- ============================================

-- Ejecutar DESPUÉS de DATABASE_SCHEMA.sql

-- Insertar items de inventario de ejemplo
INSERT INTO inventario (codigo, nombre, descripcion, categoria, precio_unitario, stock_actual, stock_minimo, unidad_medida) VALUES
('FILT-001', 'Filtro de Aceite Premium', 'Filtro de aceite de alta calidad para motores', 'Filtros', 250.00, 50, 10, 'PZA'),
('BAL-001', 'Balatas Delanteras', 'Balatas delanteras para frenos de disco', 'Frenos', 850.00, 30, 5, 'JGO'),
('ACEI-001', 'Aceite Sintético 5W-30', 'Aceite sintético para motor', 'Lubricantes', 450.00, 100, 20, 'LT'),
('BUJIA-001', 'Bujías de Platino', 'Bujías de platino de larga duración', 'Motor', 180.00, 80, 15, 'PZA'),
('LLAN-001', 'Llanta 185/65 R15', 'Llanta radial para auto', 'Llantas', 1200.00, 20, 4, 'PZA'),
('AMORT-001', 'Amortiguador Delantero', 'Amortiguador hidráulico delantero', 'Suspensión', 950.00, 15, 3, 'PZA'),
('BATER-001', 'Batería 12V 45Ah', 'Batería de arranque libre de mantenimiento', 'Eléctrico', 1800.00, 12, 2, 'PZA'),
('CORREA-001', 'Correa de Distribución', 'Correa de distribución reforzada', 'Motor', 680.00, 25, 5, 'PZA'),
('LIMPIA-001', 'Plumillas Limpiaparabrisas', 'Par de plumillas universales', 'Accesorios', 220.00, 40, 8, 'PAR'),
('REFRIG-001', 'Refrigerante Verde 1L', 'Refrigerante anticongelante', 'Lubricantes', 150.00, 60, 12, 'LT');
