-- ==============================================================================
-- FERRETERÍA NÉSTOR: MIGRACIÓN FASE 2
-- Ejecutar en el SQL Editor de tu panel de Supabase:
-- https://supabase.com/dashboard/project/ernjecfslbwpwjiilavo/sql
-- ==============================================================================

-- 1. Celular obligatorio en pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_telefono text;

-- 2. Centralización total en tabla configuracion
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS telefono text DEFAULT '(0342) 5128458';
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS whatsapp_contacto text DEFAULT '3425128458';
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS email_contacto text DEFAULT 'electricidadnestorrecreo@gmail.com';
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS direccion text DEFAULT 'Ignacio Crespo 1136, Recreo — Santa Fe';

ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS horarios jsonb DEFAULT '{
  "dias_semana": "Lun–Vie 8:00–18:00",
  "sabados": "Sáb 8:00–13:00",
  "domingos": "Cerrado"
}'::jsonb;

ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS redes_sociales jsonb DEFAULT '[
  {"id": "fb", "red": "Facebook", "url": "https://facebook.com", "icono": "f", "activo": true},
  {"id": "ig", "red": "Instagram", "url": "https://instagram.com", "icono": "ig", "activo": true}
]'::jsonb;

ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS accesos_rapidos jsonb DEFAULT '[]'::jsonb;

-- 3. Asegurar que la fila única id = 1 exista y tenga los valores iniciales
INSERT INTO configuracion (
  id, 
  descuento_porcentaje, 
  costo_envio, 
  formas_pago, 
  telefono, 
  whatsapp_contacto, 
  email_contacto, 
  direccion, 
  horarios, 
  redes_sociales, 
  accesos_rapidos
)
VALUES (
  1, 
  30, 
  0, 
  '["Efectivo", "Transferencia bancaria"]'::jsonb,
  '(0342) 5128458',
  '3425128458',
  'electricidadnestorrecreo@gmail.com',
  'Ignacio Crespo 1136, Recreo — Santa Fe',
  '{"dias_semana": "Lun–Vie 8:00–18:00", "sabados": "Sáb 8:00–13:00", "domingos": "Cerrado"}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 4. TRIGGER DE SEGURIDAD A NIVEL BASE DE DATOS
-- Solo el superadmin puede modificar datos institucionales, costos y accesos rápidos
CREATE OR REPLACE FUNCTION proteger_columnas_superadmin_config()
RETURNS trigger AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT rol INTO caller_role FROM usuarios WHERE id = auth.uid();

  IF caller_role IS DISTINCT FROM 'superadmin' THEN
    IF (OLD.accesos_rapidos IS DISTINCT FROM NEW.accesos_rapidos) OR
       (OLD.horarios IS DISTINCT FROM NEW.horarios) OR
       (OLD.redes_sociales IS DISTINCT FROM NEW.redes_sociales) OR
       (OLD.telefono IS DISTINCT FROM NEW.telefono) OR
       (OLD.whatsapp_contacto IS DISTINCT FROM NEW.whatsapp_contacto) OR
       (OLD.email_contacto IS DISTINCT FROM NEW.email_contacto) OR
       (OLD.direccion IS DISTINCT FROM NEW.direccion) OR
       (OLD.costo_envio IS DISTINCT FROM NEW.costo_envio) OR
       (OLD.formas_pago IS DISTINCT FROM NEW.formas_pago) THEN
      RAISE EXCEPTION 'Operación denegada: Solo superadmin puede modificar la configuración institucional y avanzada.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_proteger_columnas_config ON configuracion;
CREATE TRIGGER trg_proteger_columnas_config
BEFORE UPDATE ON configuracion
FOR EACH ROW
EXECUTE FUNCTION proteger_columnas_superadmin_config();
