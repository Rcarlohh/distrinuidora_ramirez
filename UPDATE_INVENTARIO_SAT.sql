-- ============================================
-- ACTUALIZACIÓN DE INVENTARIO PARA CUMPLIR CON SAT
-- ============================================

-- Agregar nuevos campos a la tabla de inventario
ALTER TABLE inventario 
ADD COLUMN IF NOT EXISTS numero_parte VARCHAR(100),
ADD COLUMN IF NOT EXISTS clave_producto_sat VARCHAR(8) DEFAULT '25172500',
ADD COLUMN IF NOT EXISTS clave_unidad_sat VARCHAR(10) DEFAULT 'H87',
ADD COLUMN IF NOT EXISTS objeto_impuesto VARCHAR(2) DEFAULT '02',
ADD COLUMN IF NOT EXISTS tasa_iva DECIMAL(5, 4) DEFAULT 0.1600,
ADD COLUMN IF NOT EXISTS marca VARCHAR(100),
ADD COLUMN IF NOT EXISTS modelo_aplicacion VARCHAR(255),
ADD COLUMN IF NOT EXISTS especificacion TEXT;

-- Comentarios para documentar los campos
COMMENT ON COLUMN inventario.numero_parte IS 'Número de parte del fabricante (ej. PH3593A)';
COMMENT ON COLUMN inventario.clave_producto_sat IS 'Clave de producto SAT de 8 dígitos (25172500=Refacciones, 15121501=Aceites, 26111700=Baterías, 78181500=Servicios)';
COMMENT ON COLUMN inventario.clave_unidad_sat IS 'Clave de unidad SAT (H87=Pieza, LTR=Litro, E48=Servicio)';
COMMENT ON COLUMN inventario.objeto_impuesto IS 'Objeto de impuesto SAT (02=Sí objeto de impuesto)';
COMMENT ON COLUMN inventario.tasa_iva IS 'Tasa de IVA (0.1600 = 16%)';
COMMENT ON COLUMN inventario.marca IS 'Marca del producto (ej. KYB, FRAM, etc.)';
COMMENT ON COLUMN inventario.modelo_aplicacion IS 'Modelo/vehículo al que aplica (ej. Nissan Versa 2015-2019)';
COMMENT ON COLUMN inventario.especificacion IS 'Especificaciones adicionales del producto';

-- Actualizar tabla de proveedores para incluir datos fiscales SAT
ALTER TABLE proveedores
ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(5),
ADD COLUMN IF NOT EXISTS regimen_fiscal VARCHAR(10),
ADD COLUMN IF NOT EXISTS uso_cfdi VARCHAR(10) DEFAULT 'G01';

COMMENT ON COLUMN proveedores.codigo_postal IS 'Código postal del domicilio fiscal';
COMMENT ON COLUMN proveedores.regimen_fiscal IS 'Régimen fiscal SAT (601, 603, 626, etc.)';
COMMENT ON COLUMN proveedores.uso_cfdi IS 'Uso de CFDI (G01=Adquisición mercancías, G03=Gastos generales, S01=Sin efectos fiscales)';

-- Crear tabla de configuración del emisor (tu refaccionaria)
CREATE TABLE IF NOT EXISTS configuracion_emisor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_comercial VARCHAR(255) NOT NULL DEFAULT 'REFACCIONARIA RAMÍREZ',
    razon_social VARCHAR(255) NOT NULL,
    rfc VARCHAR(13) NOT NULL,
    regimen_fiscal VARCHAR(10) NOT NULL,
    codigo_postal VARCHAR(5) NOT NULL,
    direccion TEXT NOT NULL,
    telefono1 VARCHAR(20),
    telefono2 VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    slogan TEXT DEFAULT 'VENTA DE REFACCIONES DE MUELLES Y SUSPENSIONES EN EQUIPO PESADO Y SERVICIO DE TALLER',
    moneda VARCHAR(3) DEFAULT 'MXN',
    decimales_precio INTEGER DEFAULT 2,
    decimales_impuesto INTEGER DEFAULT 6,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial basada en la imagen
INSERT INTO configuracion_emisor (
    nombre_comercial,
    razon_social,
    rfc,
    regimen_fiscal,
    codigo_postal,
    direccion,
    telefono1,
    telefono2,
    email,
    slogan
) VALUES (
    'REFACCIONARIA RAMÍREZ',
    'REFACCIONARIA AUTOMOTRIZ RAMIREZ',
    'RARXXXXXXXX',
    '612',
    '55760',
    'CARR. JILOTEPEC - CORRALES KM. 75, OJO DE AGUA, EDO. MÉXICO',
    '55 1917 3964',
    '77 3227 9793',
    'refaccionaria.60@hotmail.com',
    'VENTA DE REFACCIONES DE MUELLES Y SUSPENSIONES EN EQUIPO PESADO Y SERVICIO DE TALLER'
) ON CONFLICT DO NOTHING;

-- Actualizar tabla de facturas para incluir campos SAT
ALTER TABLE facturas
ADD COLUMN IF NOT EXISTS folio_fiscal UUID,
ADD COLUMN IF NOT EXISTS serie VARCHAR(10),
ADD COLUMN IF NOT EXISTS forma_pago VARCHAR(10),
ADD COLUMN IF NOT EXISTS condiciones_pago TEXT;

COMMENT ON COLUMN facturas.folio_fiscal IS 'UUID del CFDI (Folio Fiscal SAT)';
COMMENT ON COLUMN facturas.serie IS 'Serie de la factura (ej. A, B, etc.)';
COMMENT ON COLUMN facturas.forma_pago IS 'Forma de pago SAT (01=Efectivo, 03=Transferencia, 04=Tarjeta)';
COMMENT ON COLUMN facturas.condiciones_pago IS 'Condiciones de pago (ej. Contado, Crédito 30 días)';

-- Actualizar tabla de factura_detalles para incluir campos SAT
ALTER TABLE factura_detalles
ADD COLUMN IF NOT EXISTS clave_producto_sat VARCHAR(8),
ADD COLUMN IF NOT EXISTS clave_unidad_sat VARCHAR(10),
ADD COLUMN IF NOT EXISTS numero_parte VARCHAR(100),
ADD COLUMN IF NOT EXISTS objeto_impuesto VARCHAR(2) DEFAULT '02',
ADD COLUMN IF NOT EXISTS base_iva DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS tasa_iva DECIMAL(5, 4) DEFAULT 0.1600,
ADD COLUMN IF NOT EXISTS importe_iva DECIMAL(12, 2);

-- Crear función para calcular IVA en detalles de factura
CREATE OR REPLACE FUNCTION calcular_iva_detalle()
RETURNS TRIGGER AS $$
BEGIN
    NEW.base_iva := NEW.cantidad * NEW.precio_unitario;
    NEW.importe_iva := NEW.base_iva * COALESCE(NEW.tasa_iva, 0.16);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular IVA automáticamente
DROP TRIGGER IF EXISTS trigger_calcular_iva_detalle ON factura_detalles;
CREATE TRIGGER trigger_calcular_iva_detalle
    BEFORE INSERT OR UPDATE ON factura_detalles
    FOR EACH ROW
    EXECUTE FUNCTION calcular_iva_detalle();

-- Actualizar orden_detalles para incluir campos SAT
ALTER TABLE orden_detalles
ADD COLUMN IF NOT EXISTS inventario_id UUID REFERENCES inventario(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS codigo VARCHAR(50),
ADD COLUMN IF NOT EXISTS numero_parte VARCHAR(100);

-- Actualizar factura_detalles para incluir referencia a inventario
ALTER TABLE factura_detalles
ADD COLUMN IF NOT EXISTS inventario_id UUID REFERENCES inventario(id) ON DELETE SET NULL;

-- Actualizar orden_trabajo_detalles para incluir referencia a inventario
ALTER TABLE orden_trabajo_detalles
ADD COLUMN IF NOT EXISTS inventario_id UUID REFERENCES inventario(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS precio_unitario DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS importe DECIMAL(12, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED;

-- Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_inventario_numero_parte ON inventario(numero_parte);
CREATE INDEX IF NOT EXISTS idx_inventario_clave_sat ON inventario(clave_producto_sat);
CREATE INDEX IF NOT EXISTS idx_factura_detalles_inventario ON factura_detalles(inventario_id);
CREATE INDEX IF NOT EXISTS idx_orden_detalles_inventario ON orden_detalles(inventario_id);

-- Insertar datos de ejemplo con campos SAT
INSERT INTO inventario (
    codigo, 
    nombre, 
    descripcion, 
    categoria, 
    precio_unitario, 
    stock_actual, 
    stock_minimo, 
    unidad_medida,
    numero_parte,
    clave_producto_sat,
    clave_unidad_sat,
    marca,
    modelo_aplicacion,
    especificacion
) VALUES 
(
    'FIL-JET-01',
    'Filtro de Aceite Premium',
    'Filtro de Aceite Premium FRAM para Motor',
    'Filtros',
    185.00,
    25,
    5,
    'PZA',
    'PH3593A',
    '25172500',
    'H87',
    'FRAM',
    'Universal - Motores Gasolina',
    'Filtro de alta eficiencia con válvula anti-retorno'
),
(
    'AMO-DEL-01',
    'Amortiguador Delantero KYB',
    'Amortiguador Delantero KYB para Nissan Versa 2015-2019 Gas',
    'Suspensión',
    1250.00,
    12,
    3,
    'PZA',
    'KYB334501',
    '25172500',
    'H87',
    'KYB',
    'Nissan Versa 2015-2019',
    'Gas, montaje delantero, incluye kit de montaje'
),
(
    'ACE-MOT-01',
    'Aceite de Motor Sintético',
    'Aceite de Motor Sintético 5W-30 Mobil 1',
    'Lubricantes',
    450.00,
    30,
    10,
    'LTR',
    'MOB1-5W30',
    '15121501',
    'LTR',
    'Mobil 1',
    'Universal - Motores Gasolina y Diesel',
    'Sintético completo, protección avanzada'
),
(
    'SERV-MEC-01',
    'Servicio de Mano de Obra',
    'Servicio de Mano de Obra - Reparación y Mantenimiento',
    'Servicios',
    500.00,
    999,
    0,
    'SER',
    'SERV-001',
    '78181500',
    'E48',
    'REFACCIONARIA RAMÍREZ',
    'Servicios de Taller',
    'Incluye diagnóstico y mano de obra especializada'
) ON CONFLICT (codigo) DO NOTHING;

-- Vista mejorada de inventario con información SAT
CREATE OR REPLACE VIEW vista_inventario_sat AS
SELECT 
    i.id,
    i.codigo,
    i.numero_parte,
    i.nombre,
    i.descripcion,
    i.categoria,
    i.marca,
    i.modelo_aplicacion,
    i.especificacion,
    i.precio_unitario,
    i.stock_actual,
    i.stock_minimo,
    i.unidad_medida,
    i.clave_producto_sat,
    i.clave_unidad_sat,
    i.objeto_impuesto,
    i.tasa_iva,
    ROUND(i.precio_unitario * i.tasa_iva, 2) as iva_unitario,
    ROUND(i.precio_unitario * (1 + i.tasa_iva), 2) as precio_con_iva,
    i.activo,
    i.created_at,
    i.updated_at,
    CASE 
        WHEN i.stock_actual <= i.stock_minimo THEN 'BAJO'
        WHEN i.stock_actual <= (i.stock_minimo * 2) THEN 'MEDIO'
        ELSE 'NORMAL'
    END as nivel_stock
FROM inventario i
WHERE i.activo = true
ORDER BY i.nombre;

COMMENT ON VIEW vista_inventario_sat IS 'Vista completa del inventario con cálculos de IVA y clasificación SAT';
