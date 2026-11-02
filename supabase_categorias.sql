-- ==============================================================================
-- FERRETERÍA NÉSTOR: MIGRACIÓN DE CATEGORÍAS DE PRODUCTOS
-- Ejecutar en el SQL Editor de tu panel de Supabase:
-- https://supabase.com/dashboard/project/ernjecfslbwpwjiilavo/sql
-- ==============================================================================

-- 1. Crear tabla categorias
CREATE TABLE IF NOT EXISTS categorias (
  id serial PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  emoji text DEFAULT '📦',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- 3. Permitir lectura pública a cualquier usuario (para el catálogo, buscador y compras)
DROP POLICY IF EXISTS "Permitir lectura publica de categorias" ON categorias;
CREATE POLICY "Permitir lectura publica de categorias"
ON categorias FOR SELECT
USING (true);

-- 4. Permitir a superadmin y admin crear, editar o eliminar categorías
DROP POLICY IF EXISTS "Permitir admin y superadmin gestionar categorias" ON categorias;
CREATE POLICY "Permitir admin y superadmin gestionar categorias"
ON categorias FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol IN ('superadmin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol IN ('superadmin', 'admin')
  )
);

-- 5. Insertar las 6 categorías iniciales predeterminadas si no existen
INSERT INTO categorias (id, nombre, emoji) VALUES
  (1, 'Electricidad', '⚡'),
  (2, 'Herramientas', '🔨'),
  (3, 'Iluminación', '💡'),
  (4, 'Cables', '🔌'),
  (5, 'Tableros', '📋'),
  (6, 'Seguridad', '🦺')
ON CONFLICT (id) DO UPDATE 
SET nombre = EXCLUDED.nombre, emoji = EXCLUDED.emoji;

-- 6. Sincronizar la secuencia del ID para nuevas inserciones
SELECT setval(pg_get_serial_sequence('categorias', 'id'), COALESCE((SELECT MAX(id) FROM categorias), 1));
