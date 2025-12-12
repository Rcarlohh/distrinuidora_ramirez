-- ============================================
-- SCHEMA PARA SUPABASE - SISTEMA DE GESTIÓN DE COMPRAS
-- ============================================

-- Tabla de Usuarios (para login)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    rol VARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Inventario
CREATE TABLE IF NOT EXISTS inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    precio_unitario DECIMAL(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    stock_actual INTEGER DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INTEGER DEFAULT 0,
    unidad_medida VARCHAR(20) DEFAULT 'PZA',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secuencias para números autoincrementables
CREATE SEQUENCE IF NOT EXISTS seq_orden_compra START 1;
CREATE SEQUENCE IF NOT EXISTS seq_factura START 1;
CREATE SEQUENCE IF NOT EXISTS seq_orden_trabajo START 1;

-- Funciones para generar números automáticos
CREATE OR REPLACE FUNCTION generar_numero_orden_compra()
RETURNS TEXT AS $$
BEGIN
    RETURN 'OC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('seq_orden_compra')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generar_numero_factura()
RETURNS TEXT AS $$
BEGIN
    RETURN 'FAC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('seq_factura')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generar_numero_orden_trabajo()
RETURNS TEXT AS $$
BEGIN
    RETURN 'OT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('seq_orden_trabajo')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Tabla de Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_social VARCHAR(255) NOT NULL,
    rfc VARCHAR(13) UNIQUE,
    tipo_cliente VARCHAR(100),
    direccion TEXT,
    contacto VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Órdenes de Compra
CREATE TABLE IF NOT EXISTS ordenes_compra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orden VARCHAR(50) UNIQUE NOT NULL DEFAULT generar_numero_orden_compra(),
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    fecha_orden DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega DATE,
    estado VARCHAR(20) DEFAULT 'En Proceso' CHECK (estado IN ('En Proceso', 'Completada')),
    subtotal DECIMAL(12, 2) DEFAULT 0,
    iva DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    notas TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Detalles de Orden
CREATE TABLE IF NOT EXISTS orden_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    material_servicio TEXT NOT NULL,
    precio_unitario DECIMAL(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    importe DECIMAL(12, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Facturas
CREATE TABLE IF NOT EXISTS facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_factura VARCHAR(50) UNIQUE NOT NULL DEFAULT generar_numero_factura(),
    orden_id UUID REFERENCES ordenes_compra(id) ON DELETE SET NULL,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    fecha_factura DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    subtotal DECIMAL(12, 2) DEFAULT 0,
    iva DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'En Proceso' CHECK (estado IN ('En Proceso', 'Completada')),
    metodo_pago VARCHAR(50),
    notas TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Detalles de Factura
CREATE TABLE IF NOT EXISTS factura_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID REFERENCES facturas(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    importe DECIMAL(12, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Órdenes de Trabajo (Taller)
CREATE TABLE IF NOT EXISTS ordenes_trabajo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orden_trabajo VARCHAR(50) UNIQUE NOT NULL DEFAULT generar_numero_orden_trabajo(),
    
    -- Información del Cliente
    nombre_cliente VARCHAR(255) NOT NULL,
    direccion TEXT NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    
    -- Información del Vehículo
    no_placas VARCHAR(20) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    anio VARCHAR(4) NOT NULL,
    color VARCHAR(50) NOT NULL,
    kilometraje VARCHAR(20) NOT NULL,
    
    -- Información del Servicio
    descripcion_servicio TEXT NOT NULL,
    
    -- Personal
    encargado VARCHAR(255) NOT NULL,
    ayudante VARCHAR(255),
    tiempo_realizar VARCHAR(100),
    realizo_servicio VARCHAR(255),
    
    -- Entrega
    responsable_entrega VARCHAR(255),
    fecha_entrega DATE,
    entrega_llaves VARCHAR(10),
    hora_entrega_unidad TIME,
    recibe_unidad VARCHAR(255),
    
    -- Observaciones
    observaciones TEXT,
    
    -- Estado y PDF
    estado VARCHAR(20) DEFAULT 'En Proceso' CHECK (estado IN ('En Proceso', 'Completada')),
    pdf_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Detalles de Orden de Trabajo (Servicios/Materiales)
CREATE TABLE IF NOT EXISTS orden_trabajo_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_trabajo_id UUID REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    material_concepto TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX idx_ordenes_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX idx_ordenes_estado ON ordenes_compra(estado);
CREATE INDEX idx_ordenes_fecha ON ordenes_compra(fecha_orden DESC);
CREATE INDEX idx_facturas_proveedor ON facturas(proveedor_id);
CREATE INDEX idx_facturas_estado ON facturas(estado);
CREATE INDEX idx_facturas_fecha ON facturas(fecha_factura DESC);
CREATE INDEX idx_orden_detalles_orden ON orden_detalles(orden_id);
CREATE INDEX idx_factura_detalles_factura ON factura_detalles(factura_id);
CREATE INDEX idx_ordenes_trabajo_estado ON ordenes_trabajo(estado);
CREATE INDEX idx_ordenes_trabajo_fecha ON ordenes_trabajo(created_at DESC);
CREATE INDEX idx_orden_trabajo_detalles_orden ON orden_trabajo_detalles(orden_trabajo_id);
CREATE INDEX idx_inventario_codigo ON inventario(codigo);
CREATE INDEX idx_inventario_nombre ON inventario(nombre);
CREATE INDEX idx_inventario_categoria ON inventario(categoria);
CREATE INDEX idx_inventario_activo ON inventario(activo);


-- ============================================
-- TRIGGERS PARA ACTUALIZAR TOTALES
-- ============================================

-- Función para actualizar totales de orden
CREATE OR REPLACE FUNCTION actualizar_totales_orden()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ordenes_compra
    SET 
        subtotal = (
            SELECT COALESCE(SUM(importe), 0)
            FROM orden_detalles
            WHERE orden_id = COALESCE(NEW.orden_id, OLD.orden_id)
        ),
        iva = (
            SELECT COALESCE(SUM(importe), 0) * 0.16
            FROM orden_detalles
            WHERE orden_id = COALESCE(NEW.orden_id, OLD.orden_id)
        ),
        total = (
            SELECT COALESCE(SUM(importe), 0) * 1.16
            FROM orden_detalles
            WHERE orden_id = COALESCE(NEW.orden_id, OLD.orden_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.orden_id, OLD.orden_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para orden detalles
DROP TRIGGER IF EXISTS trigger_actualizar_orden ON orden_detalles;
CREATE TRIGGER trigger_actualizar_orden
    AFTER INSERT OR UPDATE OR DELETE ON orden_detalles
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_totales_orden();

-- Función para actualizar totales de factura
CREATE OR REPLACE FUNCTION actualizar_totales_factura()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE facturas
    SET 
        subtotal = (
            SELECT COALESCE(SUM(importe), 0)
            FROM factura_detalles
            WHERE factura_id = COALESCE(NEW.factura_id, OLD.factura_id)
        ),
        iva = (
            SELECT COALESCE(SUM(importe), 0) * 0.16
            FROM factura_detalles
            WHERE factura_id = COALESCE(NEW.factura_id, OLD.factura_id)
        ),
        total = (
            SELECT COALESCE(SUM(importe), 0) * 1.16
            FROM factura_detalles
            WHERE factura_id = COALESCE(NEW.factura_id, OLD.factura_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.factura_id, OLD.factura_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para factura detalles
DROP TRIGGER IF EXISTS trigger_actualizar_factura ON factura_detalles;
CREATE TRIGGER trigger_actualizar_factura
    AFTER INSERT OR UPDATE OR DELETE ON factura_detalles
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_totales_factura();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_proveedores_updated ON proveedores;
CREATE TRIGGER trigger_proveedores_updated
    BEFORE UPDATE ON proveedores
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

DROP TRIGGER IF EXISTS trigger_ordenes_updated ON ordenes_compra;
CREATE TRIGGER trigger_ordenes_updated
    BEFORE UPDATE ON ordenes_compra
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

DROP TRIGGER IF EXISTS trigger_facturas_updated ON facturas;
CREATE TRIGGER trigger_facturas_updated
    BEFORE UPDATE ON facturas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Insertar proveedores de ejemplo
INSERT INTO proveedores (nombre_social, rfc, tipo_cliente, direccion, contacto, telefono, email) VALUES
('Refacciones del Norte S.A. de C.V.', 'RNO850101ABC', 'Proveedor Premium', 'Av. Industrial 123, Monterrey, NL', 'Juan Pérez', '8181234567', 'contacto@refaccionesnorte.com'),
('Autopartes Mexicanas', 'AUM900215XYZ', 'Proveedor', 'Calle Reforma 456, CDMX', 'María González', '5555678901', 'ventas@autopartesmx.com'),
('Distribuidora de Aceites', 'DAO950330DEF', 'Distribuidor', 'Blvd. Díaz Ordaz 789, Guadalajara, JAL', 'Carlos Ramírez', '3334567890', 'info@aceites.com');

-- Insertar orden de compra de ejemplo
INSERT INTO ordenes_compra (numero_orden, proveedor_id, fecha_orden, fecha_entrega, estado, notas)
SELECT 
    'OC-2024-001',
    id,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    'En Proceso',
    'Orden urgente para inventario'
FROM proveedores
WHERE rfc = 'RNO850101ABC'
LIMIT 1;

-- Insertar detalles de orden
INSERT INTO orden_detalles (orden_id, cantidad, material_servicio, precio_unitario)
SELECT 
    id,
    10,
    'Filtro de aceite premium',
    250.00
FROM ordenes_compra
WHERE numero_orden = 'OC-2024-001';

INSERT INTO orden_detalles (orden_id, cantidad, material_servicio, precio_unitario)
SELECT 
    id,
    5,
    'Balatas delanteras',
    850.00
FROM ordenes_compra
WHERE numero_orden = 'OC-2024-001';

-- Insertar usuario admin de ejemplo
-- Usuario: admin
-- Contraseña: admin123
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol) VALUES
('admin', '$2a$10$J21bWb9LHe4biH72lSPKIO/c0GL13Bzca4zut8/VJygYUIRDqkW36', 'Administrador del Sistema', 'admin@sistema.com', 'admin');

-- Insertar usuario normal de ejemplo
-- Usuario: usuario
-- Contraseña: usuario123
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol) VALUES
('usuario', '$2a$10$eRhA7OMFELE0ZC0rDUH7TuyFZc8Zk06b6F3QbauLmXSdaXIcC4PFO', 'Usuario Normal', 'usuario@sistema.com', 'usuario');


-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de órdenes con información del proveedor
CREATE OR REPLACE VIEW vista_ordenes_completas AS
SELECT 
    o.id,
    o.numero_orden,
    o.fecha_orden,
    o.fecha_entrega,
    o.estado,
    o.subtotal,
    o.iva,
    o.total,
    p.nombre_social as proveedor,
    p.rfc as proveedor_rfc,
    p.contacto as proveedor_contacto,
    p.telefono as proveedor_telefono,
    o.created_at,
    o.updated_at
FROM ordenes_compra o
LEFT JOIN proveedores p ON o.proveedor_id = p.id
ORDER BY o.fecha_orden DESC;

-- Vista de facturas con información del proveedor
CREATE OR REPLACE VIEW vista_facturas_completas AS
SELECT 
    f.id,
    f.numero_factura,
    f.fecha_factura,
    f.fecha_vencimiento,
    f.estado,
    f.subtotal,
    f.iva,
    f.total,
    f.metodo_pago,
    p.nombre_social as proveedor,
    p.rfc as proveedor_rfc,
    o.numero_orden,
    f.created_at,
    f.updated_at
FROM facturas f
LEFT JOIN proveedores p ON f.proveedor_id = p.id
LEFT JOIN ordenes_compra o ON f.orden_id = o.id
ORDER BY f.fecha_factura DESC;

-- ============================================
-- POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- ============================================

-- Habilitar RLS si necesitas seguridad a nivel de fila
-- ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;

-- Crear políticas según tus necesidades de autenticación
