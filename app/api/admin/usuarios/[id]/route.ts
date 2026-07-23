import { NextResponse } from "next/server";
import { getSupabaseAdmin, verificarSuperadmin } from "../../../../lib/supabaseAdmin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verificarSuperadmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const { nombre, rol, activo } = await request.json();
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from("usuarios")
    .update({ nombre, rol, activo })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.auth.admin.updateUserById(id, {
    user_metadata: { nombre, rol },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verificarSuperadmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("usuarios").delete().eq("id", id);

  return NextResponse.json({ success: true });
}