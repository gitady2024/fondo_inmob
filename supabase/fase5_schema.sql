-- ============================================================================
-- FASE 5: ESQUEMA DDL Y POLÍTICAS RLS PARA FONDO INMOBILIARIO (SAAS FULL-STACK)
-- Ejecutar en Supabase: "SQL Editor" -> "New Query" -> "Run"
-- ============================================================================

-- Extensión para generación de identificadores únicos UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABLA: roles
-- Define los perfiles admitidos en la plataforma: admin, socio, tecnico
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    id VARCHAR(50) PRIMARY KEY, -- 'admin', 'socio', 'tecnico'
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserción inicial de roles
INSERT INTO public.roles (id, nombre, descripcion) VALUES
    ('admin', 'Administrador', 'Control integral del fideicomiso, administración de fondos y cuotas'),
    ('socio', 'Socio Aportante', 'Suscriptor e inversor de departamentos/unidades funcionales'),
    ('tecnico', 'Equipo Técnico', 'Gestoría pública, planos, factibilidades y certificación de obras')
ON CONFLICT (id) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

-- ----------------------------------------------------------------------------
-- 2. TABLA: user_roles
-- Vincula usuarios de Supabase Auth (auth.users) con sus roles correspondientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- ----------------------------------------------------------------------------
-- 3. TABLA: fondos
-- Contiene cada fondo o fideicomiso inmobiliario con sus parámetros en formato JSON
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fondos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    parametros_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla fondos ya existía con otro esquema previo, aseguramos las columnas requeridas:
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'fondos' AND column_name = 'parametros_json'
    ) THEN
        ALTER TABLE public.fondos ADD COLUMN parametros_json JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'fondos' AND column_name = 'admin_id'
    ) THEN
        ALTER TABLE public.fondos ADD COLUMN admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. TABLA: participaciones
-- Registra la suscripción de un socio aportante a un fondo determinado
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.participaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fondo_id UUID NOT NULL REFERENCES public.fondos(id) ON DELETE CASCADE,
    socio_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    estado VARCHAR(50) NOT NULL DEFAULT 'activo' 
        CHECK (estado IN ('activo', 'adjudicado', 'cedido', 'cancelado', 'pendiente')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fondo_id, socio_id)
);

-- ----------------------------------------------------------------------------
-- 5. TABLA: cuotas
-- Cronograma y estado de pago de las cuotas asociadas a cada participación
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cuotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participacion_id UUID NOT NULL REFERENCES public.participaciones(id) ON DELETE CASCADE,
    nro_mes INTEGER NOT NULL,
    monto NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    pagado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_pago TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participacion_id, nro_mes)
);

-- Índices de alto rendimiento para búsquedas y consultas RLS
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_fondos_admin_id ON public.fondos(admin_id);
CREATE INDEX IF NOT EXISTS idx_participaciones_socio ON public.participaciones(socio_id);
CREATE INDEX IF NOT EXISTS idx_participaciones_fondo ON public.participaciones(fondo_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_participacion ON public.cuotas(participacion_id);

-- ============================================================================
-- FUNCIONES AUXILIARES DE SEGURIDAD
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_id = 'admin'
  );
$$;

-- ============================================================================
-- ACTIVACIÓN DE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fondos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuotas ENABLE ROW LEVEL SECURITY;

-- Limpieza preventiva de políticas previas para ejecución limpia
DROP POLICY IF EXISTS "Lectura de roles para usuarios autenticados" ON public.roles;
DROP POLICY IF EXISTS "Usuarios pueden consultar sus propios roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins pueden gestionar user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin CRUD sobre sus fondos" ON public.fondos;
DROP POLICY IF EXISTS "Socios pueden consultar fondos en los que participan" ON public.fondos;
DROP POLICY IF EXISTS "Socio SELECT sobre sus participaciones" ON public.participaciones;
DROP POLICY IF EXISTS "Admin CRUD participaciones de sus fondos" ON public.participaciones;
DROP POLICY IF EXISTS "Socio SELECT sobre sus cuotas" ON public.cuotas;
DROP POLICY IF EXISTS "Admin CRUD cuotas de sus fondos" ON public.cuotas;

-- ----------------------------------------------------------------------------
-- POLÍTICAS RLS: roles
-- ----------------------------------------------------------------------------
CREATE POLICY "Lectura de roles para usuarios autenticados"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- POLÍTICAS RLS: user_roles
-- ----------------------------------------------------------------------------
CREATE POLICY "Usuarios pueden consultar sus propios roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins pueden gestionar user_roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- POLÍTICAS RLS: fondos (REGLA 2)
-- Un admin puede hacer CRUD sobre los fondos donde él sea el admin_id
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin CRUD sobre sus fondos"
    ON public.fondos FOR ALL
    TO authenticated
    USING (admin_id = auth.uid())
    WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Socios pueden consultar fondos en los que participan"
    ON public.fondos FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.participaciones p
            WHERE p.fondo_id = public.fondos.id
              AND p.socio_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- POLÍTICAS RLS: participaciones (REGLA 1)
-- Un socio solo puede hacer SELECT donde socio_id coincida con su auth.uid()
-- ----------------------------------------------------------------------------
CREATE POLICY "Socio SELECT sobre sus participaciones"
    ON public.participaciones FOR SELECT
    TO authenticated
    USING (socio_id = auth.uid());

CREATE POLICY "Admin CRUD participaciones de sus fondos"
    ON public.participaciones FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.fondos f
            WHERE f.id = public.participaciones.fondo_id
              AND f.admin_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.fondos f
            WHERE f.id = public.participaciones.fondo_id
              AND f.admin_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- POLÍTICAS RLS: cuotas (REGLA 1)
-- Un socio solo puede hacer SELECT sobre cuotas de su participación
-- ----------------------------------------------------------------------------
CREATE POLICY "Socio SELECT sobre sus cuotas"
    ON public.cuotas FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.participaciones p
            WHERE p.id = public.cuotas.participacion_id
              AND p.socio_id = auth.uid()
        )
    );

CREATE POLICY "Admin CRUD cuotas de sus fondos"
    ON public.cuotas FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.participaciones p
            JOIN public.fondos f ON f.id = p.fondo_id
            WHERE p.id = public.cuotas.participacion_id
              AND f.admin_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.participaciones p
            JOIN public.fondos f ON f.id = p.fondo_id
            WHERE p.id = public.cuotas.participacion_id
              AND f.admin_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- TRIGGER AUTOMÁTICO: Asignar rol inicial al registrarse nuevo usuario
-- (Si se registra un usuario en Supabase Auth, se le asigna rol 'socio' por defecto)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role'), 'socio'))
    ON CONFLICT (user_id, role_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_role();
