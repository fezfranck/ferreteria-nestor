import { NextResponse } from "next/server";
import { getSupabaseAdmin, verificarSuperadmin } from "../../../lib/supabaseAdmin";

export async function GET(request: Request) {
  const admin = await verificarSuperadmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select("id, nombre, email, rol, activo, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ usuarios: data });
}

export async function POST(request: Request) {
  const admin = await verificarSuperadmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { nombre, email, password, rol } = await request.json();
  if (!nombre || !email || !password || !rol) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: nuevoUsuario, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Guardamos también el perfil en la tabla "usuarios" (por si no hay trigger automático)
  const { error: errorPerfil } = await supabaseAdmin
    .from("usuarios")
    .upsert({ id: nuevoUsuario.user.id, nombre, email, rol, activo: true });

  if (errorPerfil) return NextResponse.json({ error: errorPerfil.message }, { status: 500 });

  return NextResponse.json({ success: true });
}