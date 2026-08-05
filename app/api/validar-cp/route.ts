import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { codigoPostal, localidad, provincia } = await request.json();

    if (!codigoPostal || !localidad || !provincia) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: cpValido, error } = await supabaseAdmin.rpc("validar_codigo_postal", {
      cp_input: codigoPostal,
      localidad_input: localidad,
      provincia_input: provincia,
    });

    if (error) {
      console.error("Error rpc validar_codigo_postal:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cpValido });
  } catch (err: any) {
    console.error("Error API validar-cp:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
