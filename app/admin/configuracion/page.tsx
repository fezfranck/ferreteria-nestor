"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function AdminConfiguracion() {
  const { user } = useAuth();
  const [descuento, setDescuento] = useState(30);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [formasPago, setFormasPago] = useState<string[]>([]);
  const [nuevaFormaPago, setNuevaFormaPago] = useState("");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    async function fetchConfig() {
      const { data, error } = await supabase
        .from("configuracion")
        .select("descuento_porcentaje, costo_envio, formas_pago")
        .eq("id", 1)
        .single();

      if (!error && data) {
        setDescuento(data.descuento_porcentaje);
        setCostoEnvio(data.costo_envio || 0);
        setFormasPago(data.formas_pago || []);
      }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  const agregarFormaPago = () => {
    if (nuevaFormaPago.trim() && !formasPago.includes(nuevaFormaPago.trim())) {
      setFormasPago([...formasPago, nuevaFormaPago.trim()]);
      setNuevaFormaPago("");
    }
  };

  const eliminarFormaPago = (index: number) => {
    setFormasPago(formasPago.filter((_, i) => i !== index));
  };

  async function guardar() {
    setGuardando(true);
    
    const payload: any = {
      descuento_porcentaje: descuento
    };

    if (user?.rol === "superadmin") {
      payload.costo_envio = costoEnvio;
      payload.formas_pago = formasPago;
    }

    const { error } = await supabase
      .from("configuracion")
      .update(payload)
      .eq("id", 1);

    if (error) {
      console.error("Error guardando configuración:", error);
      setMensaje("❌ Error: " + error.message);
    } else {
      setMensaje("✅ Configuración actualizada correctamente");
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
        className="bg-white rounded-xl p-6 max-w-md flex flex-col gap-5"
        style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
      >
        <div>
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
        </div>

        {user?.rol === "superadmin" && (
          <>
            <div className="border-t border-black/10 pt-5">
              <label className="block text-xs font-bold uppercase tracking-wide mb-2">
                Costo de envío ($)
              </label>
              <p className="text-xs mb-3" style={{ color: "#888" }}>
                Costo fijo cobrado en los pedidos con envío a domicilio.
              </p>
              {loading ? (
                <p className="text-sm" style={{ color: "#aaa" }}>Cargando...</p>
              ) : (
                <input
                  type="number"
                  min={0}
                  value={costoEnvio}
                  onChange={e => setCostoEnvio(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm rounded-lg outline-none"
                  style={{ border: "1.5px solid rgba(0,0,0,0.12)", background: "#fafafa" }}
                />
              )}
            </div>

            <div className="border-t border-black/10 pt-5">
              <label className="block text-xs font-bold uppercase tracking-wide mb-2">
                Formas de pago aceptadas
              </label>
              <p className="text-xs mb-3" style={{ color: "#888" }}>
                Opciones de pago que se le presentarán al cliente en el checkout.
              </p>
              {loading ? (
                <p className="text-sm" style={{ color: "#aaa" }}>Cargando...</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Form para agregar */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nuevaFormaPago}
                      onChange={e => setNuevaFormaPago(e.target.value)}
                      placeholder="Ej. Transferencia"
                      className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
                      style={{ border: "1.5px solid rgba(0,0,0,0.12)", background: "#fafafa" }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          agregarFormaPago();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={agregarFormaPago}
                      className="px-4 py-2 text-xs font-bold rounded-lg text-white transition-all bg-[#1B87C8] hover:bg-[#1569A0]"
                    >
                      Agregar
                    </button>
                  </div>

                  {/* Lista */}
                  <div className="flex flex-col gap-1.5 mt-1 max-h-40 overflow-y-auto">
                    {formasPago.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No hay formas de pago configuradas.</p>
                    ) : (
                      formasPago.map((fp, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-black/5 text-xs text-gray-800"
                        >
                          <span>{fp}</span>
                          <button
                            type="button"
                            onClick={() => eliminarFormaPago(i)}
                            className="text-red-500 hover:text-red-700 font-bold px-1 transition-colors"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={guardar}
          disabled={guardando || loading}
          className="mt-2 w-full py-3 rounded-lg font-bold text-sm transition-all"
          style={{ background: "#1B87C8", color: "white" }}
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}