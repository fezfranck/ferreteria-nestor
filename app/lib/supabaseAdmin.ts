import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Verifica que quien hace la petición esté logueado y sea superadmin.
// Devuelve el usuario si es válido, o null si no tiene permiso.
export async function verificarSuperadmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: perfil } = await supabaseAdmin
    .from("usuarios")
    .select("rol")
    .eq("id", data.user.id)
    .single();

  if (perfil?.rol !== "superadmin") return null;
  return data.user;
}