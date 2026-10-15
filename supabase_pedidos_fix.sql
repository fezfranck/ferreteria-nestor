-- Ejecutar este script en el SQL Editor de tu panel de Supabase:
-- https://supabase.com/dashboard/project/ernjecfslbwpwjiilavo/sql
--
-- Agrega la columna direccion_envio a la tabla pedidos para guardar
-- los datos completos de envío a domicilio en formato estructurado (JSONB).

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS direccion_envio jsonb;
