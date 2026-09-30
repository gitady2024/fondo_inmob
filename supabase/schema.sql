-- =========================================================================
-- ESQUEMA DE BASE DE DATOS: FONDO INMOBILIARIO DE AHORRO PREVIO MUTUO
-- Compatible con PostgreSQL 15+ y Supabase
-- =========================================================================

-- Habilitar extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: fondos (Parámetros generales de cada círculo o fideicomiso)
CREATE TABLE IF NOT EXISTS public.fondos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL DEFAULT 'Círculo Inmobiliario Mutuo 1',
    descripcion TEXT,
    costo_depto NUMERIC(15,2) NOT NULL DEFAULT 65000.00,
    cantidad_deptos INTEGER NOT NULL DEFAULT 10,
    cantidad_cuotas INTEGER NOT NULL DEFAULT 48,
    valor_cuota_base NUMERIC(15,2) NOT NULL DEFAULT 1354.00,
    fecha_inicio DATE NOT NULL DEFAULT '2027-01-01',
    modalidad_anticipo VARCHAR(30) NOT NULL DEFAULT 'reducir_cuota' 
        CHECK (modalidad_anticipo IN ('reducir_cuota', 'reducir_plazo')),
    forma_pago_gastos VARCHAR(30) NOT NULL DEFAULT 'final' 
        CHECK (forma_pago_gastos IN ('final', 'prorrateado')),
    comision_gestion_pct NUMERIC(5,2) NOT NULL DEFAULT 7.00,
    comision_escribania_pct NUMERIC(5,2) NOT NULL DEFAULT 3.00,
    otros_gastos NUMERIC(15,2) NOT NULL DEFAULT 500.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA: socios (Socios o suscriptores de cada departamento dentro de un fondo)
CREATE TABLE IF NOT EXISTS public.socios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fondo_id UUID NOT NULL REFERENCES public.fondos(id) ON DELETE CASCADE,
    numero_socio INTEGER NOT NULL,
    unidad_depto VARCHAR(50) NOT NULL, -- Ej: 'Depto 1', 'Unidad 4B'
    nombre_completo VARCHAR(150),
    dni_cuit VARCHAR(30),
    email VARCHAR(100),
    telefono VARCHAR(50),
    anticipo_mes0 NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    cuota_posesion_fijada INTEGER NOT NULL DEFAULT 15,
    estado_titular VARCHAR(30) NOT NULL DEFAULT 'activo'
        CHECK (estado_titular IN ('activo', 'adjudicado', 'cedido', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fondo_id, numero_socio)
);

-- 3. TABLA: pagos_cuotas (Registro contable real de pagos de cuotas mes a mes)
CREATE TABLE IF NOT EXISTS public.pagos_cuotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fondo_id UUID NOT NULL REFERENCES public.fondos(id) ON DELETE CASCADE,
    socio_id UUID NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
    numero_cuota INTEGER NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    fecha_pago DATE,
    monto_capital NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    monto_gastos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    monto_adelanto NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    monto_total_pagado NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    comprobante_url TEXT,
    metodo_pago VARCHAR(50) DEFAULT 'transferencia',
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'abonado', 'vencido', 'eximido')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(socio_id, numero_cuota)
);

-- 4. TABLA: cesiones_contractuales (Registro de cesiones según Arts. 1636-1640 CCCN)
CREATE TABLE IF NOT EXISTS public.cesiones_contractuales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fondo_id UUID NOT NULL REFERENCES public.fondos(id) ON DELETE CASCADE,
    socio_cedente_id UUID NOT NULL REFERENCES public.socios(id) ON DELETE RESTRICT,
    nombre_adquirente VARCHAR(150) NOT NULL,
    dni_adquirente VARCHAR(30) NOT NULL,
    cuota_salida INTEGER NOT NULL,
    capital_aportado_base NUMERIC(15,2) NOT NULL,
    prima_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    monto_prima NUMERIC(15,2) NOT NULL,
    arancel_cesion NUMERIC(15,2) NOT NULL,
    monto_neto_cedente NUMERIC(15,2) NOT NULL,
    mecanismo_salida VARCHAR(30) NOT NULL DEFAULT 'tercero'
        CHECK (mecanismo_salida IN ('tercero', 'preferencia', 'diferido')),
    fecha_cesion DATE NOT NULL DEFAULT CURRENT_DATE,
    estado_instrumento VARCHAR(30) NOT NULL DEFAULT 'firmado'
        CHECK (estado_instrumento IN ('borrador', 'firmado', 'protocolizado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA: licitaciones_adelantos (Inyecciones de capital y licitaciones)
CREATE TABLE IF NOT EXISTS public.licitaciones_adelantos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fondo_id UUID NOT NULL REFERENCES public.fondos(id) ON DELETE CASCADE,
    socio_id UUID NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
    cuota_ejecucion INTEGER NOT NULL,
    monto_ofertado NUMERIC(15,2) NOT NULL,
    estrategia VARCHAR(30) NOT NULL DEFAULT 'reducir_cuota'
        CHECK (estrategia IN ('reducir_cuota', 'acelerar')),
    resultado VARCHAR(30) NOT NULL DEFAULT 'aprobado'
        CHECK (resultado IN ('postulado', 'ganador', 'aprobado', 'rechazado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÍNDICES para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_socios_fondo_id ON public.socios(fondo_id);
CREATE INDEX IF NOT EXISTS idx_pagos_socio_id ON public.pagos_cuotas(socio_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fondo_id ON public.pagos_cuotas(fondo_id);

-- POLÍTICAS RLS (Row Level Security) básicas
ALTER TABLE public.fondos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_cuotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cesiones_contractuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licitaciones_adelantos ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura y escritura anónima (para desarrollo / demo público)
CREATE POLICY "Permitir lectura publica de fondos" ON public.fondos FOR SELECT USING (true);
CREATE POLICY "Permitir insercion y actualizacion publica de fondos" ON public.fondos FOR ALL USING (true);

CREATE POLICY "Permitir acceso publico a socios" ON public.socios FOR ALL USING (true);
CREATE POLICY "Permitir acceso publico a pagos" ON public.pagos_cuotas FOR ALL USING (true);
CREATE POLICY "Permitir acceso publico a cesiones" ON public.cesiones_contractuales FOR ALL USING (true);
CREATE POLICY "Permitir acceso publico a licitaciones" ON public.licitaciones_adelantos FOR ALL USING (true);
