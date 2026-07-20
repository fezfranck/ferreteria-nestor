"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminConfiguracion() {
  const [descuento, setDescuento] = useState(30);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    async function fetchConfig() {
      const { data, error } = await supabase
        .from("configuracion")
        .select("descuento_porcentaje")
        .eq("id", 1)
        .single();

      if (!error && data) setDescuento(data.descuento_porcentaje);
      setLoading(false);
    }
    fetchConfig();
  }, []);

  async function guardar() {
    setGuardando(true);
    const { error } = await supabase
      .from("configuracion")
      .update({ descuento_porcentaje: descuento })
      .eq("id", 1);

    if (error) {
      console.error("Error guardando configuración:", error);
      setMensaje("❌ Error: " + error.message);
    } else {
      setMensaje("✅ Descuento actualizado correctamente");
    }
    setGuardando(false);
    setTimeout(() => setMensaje(""), 3000);
  }

  return (
    <div>
      <h1
        className="font-black uppercase text-4xl leading-none mb-6"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        Configuración del <span style={{ color: "#1B87C8" }}>Sitio</span>
      </h1>

      {mensaje && (
        <div
          className="rounded-lg px-4 py-3 mb-4 text-sm font-medium"
          style={{
            background: mensaje.startsWith("❌") ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)",
            color: mensaje.startsWith("❌") ? "#DC2626" : "#16A34A",
            border: mensaje.startsWith("❌") ? "1px solid rgba(220,38,38,0.2)" : "1px solid rgba(22,163,74,0.2)",
          }}
        >
          {mensaje}
        </div>
      )}

      <div
        className="bg-white rounded-xl p-6 max-w-md"
        style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
      >
        <label className="block text-xs font-bold uppercase tracking-wide mb-2">
          Porcentaje de descuento (banner de inicio)
        </label>
        <p className="text-xs mb-3" style={{ color: "#888" }}>
          Se muestra en el banner "HASTA X% DE DESCUENTO" de la página principal.
        </p>

        {loading ? (
          <p className="text-sm" style={{ color: "#aaa" }}>Cargando...</p>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={100}
              value={descuento}
              onChange={e => setDescuento(Number(e.target.value))}
              className="w-24 px-4 py-3 text-lg font-bold rounded-lg outline-none"
              style={{ border: "1.5px solid rgba(0,0,0,0.12)" }}
            />
            <span className="text-lg font-bold">%</span>
          </div>
        )}

        <button
          onClick={guardar}
          disabled={guardando || loading}
          className="mt-5 w-full py-3 rounded-lg font-bold text-sm transition-all"
          style={{ background: "#1B87C8", color: "white" }}
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}