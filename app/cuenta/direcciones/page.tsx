"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import AddressForm, { Direccion } from "../../components/AddressForm";

interface DireccionGuardada {
  id: string;
  user_id: string;
  etiqueta: string;
  provincia: string;
  localidad: string;
  calle: string;
  altura: string;
  piso?: string | null;
  indicaciones?: string | null;
  codigo_postal: string;
  lat?: number | null;
  lon?: number | null;
  created_at: string;
}

export default function MisDireccionesPage() {
  const { user } = useAuth();
  const [direcciones, setDirecciones] = useState<DireccionGuardada[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Estados del formulario nuevo
  const [etiqueta, setEtiqueta] = useState("Casa");
  const [direccionValidada, setDireccionValidada] = useState<Direccion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  useEffect(() => {
    if (user) {
      cargarDirecciones();
    }
  }, [user]);

  async function cargarDirecciones() {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("direcciones_guardadas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setDirecciones(data as DireccionGuardada[]);
      } else {
        console.error("Error al cargar direcciones:", error);
      }
    } catch (err) {
      console.error("Error de conexión al cargar direcciones:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleDireccionValida(dir: Direccion) {
    setDireccionValidada(dir);
  }

  async function handleGuardarDireccion() {
    if (!user || !direccionValidada) return;

    setGuardando(true);
    setMensaje(null);

    try {
      const nuevaDireccion = {
        user_id: user.id,
        etiqueta: etiqueta.trim() || "Mi Dirección",
        provincia: direccionValidada.provincia,
        localidad: direccionValidada.localidad,
        calle: direccionValidada.calle,
        altura: direccionValidada.altura,
        piso: direccionValidada.piso || null,
        indicaciones: direccionValidada.indicaciones || null,
        codigo_postal: direccionValidada.codigoPostal,
        lat: direccionValidada.lat,
        lon: direccionValidada.lon,
      };

      const { error } = await supabase
        .from("direcciones_guardadas")
        .insert([nuevaDireccion]);

      if (error) {
        throw new Error(error.message);
      }

      setMensaje({ tipo: "exito", texto: "Dirección guardada correctamente." });
      setMostrarFormulario(false);
      setDireccionValidada(null);
      setEtiqueta("Casa");
      await cargarDirecciones();
    } catch (err: any) {
      console.error("Error al guardar dirección:", err);
      setMensaje({
        tipo: "error",
        texto: err.message || "No pudimos guardar la dirección. Probá nuevamente.",
      });
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Estás seguro de que querés eliminar esta dirección?")) return;

    setEliminandoId(id);
    setMensaje(null);
    try {
      const { error } = await supabase
        .from("direcciones_guardadas")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      setMensaje({ tipo: "exito", texto: "Dirección eliminada correctamente." });
      setDirecciones(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      console.error("Error al eliminar dirección:", err);
      setMensaje({
        tipo: "error",
        texto: err.message || "No se pudo eliminar la dirección.",
      });
    } finally {
      setEliminandoId(null);
    }
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER DE SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className="font-black uppercase text-2xl sm:text-3xl text-gray-900"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Mis Direcciones Guardadas
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Administrá tus domicilios de entrega para agilizar tus compras
          </p>
        </div>

        {!mostrarFormulario && (
          <button
            onClick={() => {
              setMostrarFormulario(true);
              setDireccionValidada(null);
              setMensaje(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all shadow-md hover:brightness-105 self-start sm:self-auto"
            style={{ background: "#1B87C8" }}
          >
            <span>➕</span> Agregar nueva dirección
          </button>
        )}
      </div>

      {/* FEEDBACK MENSAJES */}
      {mensaje && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            mensaje.tipo === "exito"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <span>{mensaje.tipo === "exito" ? "✅" : "❌"}</span>
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* FORMULARIO PARA AGREGAR NUEVA DIRECCIÓN */}
      {mostrarFormulario && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-[#1B87C8]/30 shadow-md">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
            <div>
              <h3
                className="font-black uppercase text-xl text-gray-900"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Nueva Dirección de Entrega
              </h3>
              <p className="text-xs text-gray-500">Ingresá los datos del domicilio y verificalos</p>
            </div>
            <button
              onClick={() => {
                setMostrarFormulario(false);
                setDireccionValidada(null);
              }}
              className="text-gray-400 hover:text-gray-600 text-lg p-1"
              aria-label="Cerrar formulario"
            >
              ✕
            </button>
          </div>

          <div className="space-y-5">
            {/* Campo de Etiqueta */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Etiqueta identificatoria *
              </label>
              <input
                type="text"
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                placeholder="Ej: Casa, Trabajo, Taller, Obra"
                className="w-full px-4 py-2.5 text-sm rounded-lg outline-none border border-black/12 focus:border-[#1B87C8] transition-colors"
                required
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Un nombre corto para identificar fácilmente esta dirección.
              </span>
            </div>

            {/* Integración del componente AddressForm existente (sin reescribirlo) */}
            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Datos de ubicación y verificación
              </label>
              <AddressForm onDireccionValida={handleDireccionValida} />
            </div>

            {/* Confirmación y Guardado */}
            {direccionValidada && (
              <div className="p-4 rounded-xl bg-[#F0F7FD] border border-[#D6EAF8] flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="text-sm text-gray-700">
                  <span className="font-bold text-[#1B87C8]">📍 Dirección lista para guardar:</span>{" "}
                  {direccionValidada.calle} {direccionValidada.altura},{" "}
                  {direccionValidada.localidad} ({direccionValidada.provincia}) — CP {direccionValidada.codigoPostal}
                </div>
                <button
                  type="button"
                  onClick={handleGuardarDireccion}
                  disabled={guardando}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-sm text-white transition-all shadow-sm hover:brightness-105 flex-shrink-0"
                  style={{ background: "#F5A623", color: "#1A1A1A" }}
                >
                  {guardando ? "Guardando..." : "💾 Guardar en mi cuenta"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LISTADO DE DIRECCIONES */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-black/8 shadow-xs animate-pulse">
              <div className="h-6 w-24 bg-gray-200 rounded-full mb-4" />
              <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 rounded mb-4" />
              <div className="h-8 w-20 bg-gray-200 rounded ml-auto" />
            </div>
          ))}
        </div>
      ) : direcciones.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 sm:p-14 text-center border border-black/8 shadow-xs max-w-xl mx-auto">
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4"
            style={{ background: "#F0F7FD", color: "#1B87C8" }}
          >
            📍
          </div>
          <h3
            className="font-black uppercase text-2xl mb-2 text-gray-900"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            No tenés direcciones guardadas
          </h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
            Guardá tus domicilios habituales para que el proceso de compra y envío sea mucho más rápido.
          </p>
          {!mostrarFormulario && (
            <button
              onClick={() => setMostrarFormulario(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white transition-all shadow-md hover:brightness-105"
              style={{ background: "#1B87C8" }}
            >
              <span>➕</span> Agregar primera dirección
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {direcciones.map((dir) => (
            <article
              key={dir.id}
              className="bg-white rounded-2xl p-6 border border-black/8 shadow-xs hover:border-[#1B87C8]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{ background: "#F0F7FD", color: "#1B87C8", border: "1px solid #D6EAF8" }}
                  >
                    🏷️ {dir.etiqueta}
                  </span>
                  <span className="text-xs text-gray-400">
                    CP {dir.codigo_postal}
                  </span>
                </div>

                <h4 className="font-bold text-lg text-gray-900 mb-1">
                  {dir.calle} {dir.altura}
                  {dir.piso ? <span className="text-gray-500 font-normal"> (Piso/Depto: {dir.piso})</span> : null}
                </h4>

                <p className="text-sm text-gray-600 mb-2">
                  {dir.localidad}, {dir.provincia}
                </p>

                {dir.indicaciones && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100 italic mb-4">
                    📝 {dir.indicaciones}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleEliminar(dir.id)}
                  disabled={eliminandoId === dir.id}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {eliminandoId === dir.id ? "Eliminando..." : "🗑️ Eliminar dirección"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
