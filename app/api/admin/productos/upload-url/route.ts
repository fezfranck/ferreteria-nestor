import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { supabase } from "../../../../lib/supabase";

export async function POST(request: Request) {
  try {
    const { url, sku } = await request.json();

    if (!url || !sku) {
      return NextResponse.json({ error: "Falta url o sku" }, { status: 400 });
    }

    // Descargar imagen desde el servidor sin restricciones de CORS del navegador
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `No se pudo descargar la imagen externa (${response.status})` },
        { status: 400 }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extension = "jpg";
    if (contentType.includes("png")) extension = "png";
    else if (contentType.includes("webp")) extension = "webp";
    else if (contentType.includes("gif")) extension = "gif";
    else {
      const match = url.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
      if (match && match[1]) {
        extension = match[1].toLowerCase();
      }
    }

    const cleanSku = String(sku).replace(/[^a-zA-Z0-9_-]/g, "_");
    const nombreArchivo = `${cleanSku}-${Date.now()}.${extension}`;

    const client = process.env.SUPABASE_SECRET_KEY ? getSupabaseAdmin() : supabase;

    const { error: uploadError } = await client.storage
      .from("productos")
      .upload(nombreArchivo, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Error al subir a Supabase Storage:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = client.storage
      .from("productos")
      .getPublicUrl(nombreArchivo);

    return NextResponse.json({ publicUrl: urlData.publicUrl });
  } catch (err: any) {
    console.error("Error en upload-url route:", err);
    return NextResponse.json(
      { error: err.message || "Error al procesar la imagen externa" },
      { status: 500 }
    );
  }
}
