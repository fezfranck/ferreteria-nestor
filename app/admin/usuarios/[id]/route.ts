import { NextResponse } from "next/server";
import { getSupabaseAdmin, verificarSuperadmin } from "@/app/lib/supabaseAdmin";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await verificarSuperadmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { nombre, rol, activo } = await request.json();
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from("usuarios")
    .update({ nombre, rol, activo })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.auth.admin.updateUserById(params.id, {
    user_metadata: { nombre, rol },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = await verificarSuperadmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin.auth.admin.deleteUser(params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("usuarios").delete().eq("id", params.id);

  return NextResponse.json({ success: true });
}