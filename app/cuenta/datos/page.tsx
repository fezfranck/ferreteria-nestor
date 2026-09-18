"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

export default function MisDatosPage() {
  const { user, refreshUser } = useAuth();
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    if (user?.nombre) {
      setNombre(user.nombre);
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setMensajeError("El nombre no puede estar vacío.");
      return;
    }

    setGuardando(true);
    setMensajeExito("");
    setMensajeError("");

    try {
      // 1. Actualizar en la tabla usuarios (donde id = user.id)
      const { error: dbError } = await supabase
        .from("usuarios")
        .update({ nombre: nombreLimpio })
        .eq("id", user.id);

      if (dbError) {
        throw new Error(dbError.message || "Error al actualizar en la base de datos.");
      }

      // 2. Sincronizar también en la sesión de Supabase Auth
      await supabase.auth.updateUser({
        data: { nombre: nombreLimpio },
      });

      // 3. Refrescar estado global del usuario
      await refreshUser();

      setMensajeExito("Tus datos se actualizaron correctamente.");
      setTimeout(() => setMensajeExito(""), 4000);
    } catch (err: any) {
      console.error("Error al actualizar datos:", err);
      setMensajeError(err.message || "No pudimos guardar los cambios. Intentalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (!user) return null;

  const inputClass =
    "w-full px-4 py-3 text-sm rounded-xl outline-none border border-black/12 bg-[#fafafa] text-[#1A1A1A] transition-all focus:bg-white focus:border-[#1B87C8] focus:ring-2 focus:ring-[#1B87C8]/20";

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h2
          className="font-black uppercase text-2xl sm:text-3xl text-gray-900"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Mis Datos Personales
        </h2>
        <p className="text-xs sm:text-sm text-gray-500">
          Gestioná la información de tu perfil y cuenta de usuario
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/8 shadow-xs">
        {mensajeExito && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <span>✅</span>
            <span>{mensajeExito}</span>
          </div>
        )}

        {mensajeError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span>❌</span>
            <span>{mensajeError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Correo Electrónico (No editable) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 text-sm rounded-xl border border-black/8 bg-gray-100 text-gray-500 cursor-not-allowed select-none"
            />
            <span className="text-xs text-gray-400 mt-1.5 block">
              🔒 El correo electrónico está asociado a tu acceso y no puede modificarse directamente.
            </span>
          </div>

          {/* Nombre y Apellido (Editable) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Tu nombre y apellido"
              className={inputClass}
            />
          </div>

          {/* Rol del usuario (informativo) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Tipo de Usuario
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wide">
                {user.rol}
              </span>
              <span className="text-xs text-gray-400">
                Rol asignado a tu cuenta
              </span>
            </div>
          </div>

          {/* Botón de Guardar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm text-white transition-all shadow-md hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#1B87C8" }}
            >
              {guardando ? "Guardando cambios..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
