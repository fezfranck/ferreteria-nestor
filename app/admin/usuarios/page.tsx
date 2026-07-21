"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: "superadmin" | "admin" | "vendedor" | "comprador";
  activo: boolean;
  created_at: string;
}

const ROLES = ["superadmin", "admin", "vendedor", "comprador"];

const roleColors: Record<string, { bg: string; color: string }> = {
  superadmin: { bg: "rgba(128,90,213,0.1)", color: "#805AD5" },
  admin: { bg: "rgba(27,135,200,0.1)", color: "#1B87C8" },
  vendedor: { bg: "rgba(56,161,105,0.1)", color: "#38A169" },
  comprador: { bg: "rgba(214,158,46,0.1)", color: "#D69E2E" },
};

const vacío = {
  nombre: "", email: "", password: "",
  rol: "comprador" as Usuario["rol"], activo: true,
};

async function obtenerToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export default function AdminUsuarios() {
  const { user: userActual } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState(vacío);
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (userActual?.rol === "superadmin") fetchUsuarios();
  }, [userActual]);

  async function fetchUsuarios() {
    setLoading(true);
    const token = await obtenerToken();
    const res = await fetch("/api/admin/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setUsuarios(data.usuarios);
    else console.error(data.error);
    setLoading(false);
  }

  function abrirNuevo() {
    setEditando(null);
    setForm(vacío);
    setModalOpen(true);
  }

  function abrirEditar(u: Usuario) {
    setEditando(u);
    setForm({ nombre: u.nombre, email: u.email, password: "", rol: u.rol, activo: u.activo });
    setModalOpen(true);
  }

  async function guardar() {
    setGuardando(true);
    const token = await obtenerToken();

    const res = editando
      ? await fetch(`/api/admin/usuarios/${editando.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ nombre: form.nombre, rol: form.rol, activo: form.activo }),
        })
      : await fetch("/api/admin/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });

    const data = await res.json();
    if (!res.ok) {
      setMensaje("❌ Error: " + data.error);
    } else {
      setMensaje(editando ? "✅ Usuario actualizado correctamente" : "✅ Usuario creado correctamente");
      setModalOpen(false);
      fetchUsuarios();
    }
    setGuardando(false);
    setTimeout(() => setMensaje(""), 4000);
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    const token = await obtenerToken();
    const res = await fetch(`/api/admin/usuarios/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setMensaje("❌ Error: " + data.error);
      setTimeout(() => setMensaje(""), 4000);
    } else {
      fetchUsuarios();
    }
  }

  async function toggleActivo(u: Usuario) {
    const token = await obtenerToken();
    await fetch(`/api/admin/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nombre: u.nombre, rol: u.rol, activo: !u.activo }),
    });
    fetchUsuarios();
  }

  const filtrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const inputStyle = {
    width: "100%", padding: "9px 12px", fontSize: "13px",
    borderRadius: "8px", border: "1.5px solid rgba(0,0,0,0.12)",
    outline: "none", background: "#fafafa",
  };

  if (userActual?.rol !== "superadmin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="font-black uppercase text-3xl mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Acceso restringido
        </h2>
        <p style={{ color: "#555" }}>Solo el superadmin puede gestionar usuarios.</p>
      </div>
    );
  }

  return (
    <div>
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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-black uppercase text-4xl leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Gestión de <span style={{ color: "#1B87C8" }}>Usuarios</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "#555" }}>{usuarios.length} usuarios registrados</p>
        </div>
        <button onClick={abrirNuevo} className="px-5 py-2 rounded-lg font-bold text-sm" style={{ background: "#1B87C8", color: "white" }}>
          + Nuevo usuario
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {ROLES.map(rol => (
          <div key={rol} className="bg-white rounded-xl p-4 text-center" style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}>
            <div className="font-black text-3xl mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: roleColors[rol].color }}>
              {usuarios.filter(u => u.rol === rol).length}
            </div>
            <div className="text-xs font-bold uppercase capitalize" style={{ color: "#555" }}>{rol}</div>
          </div>
        ))}
      </div>

      <div className="flex rounded-full overflow-hidden mb-5" style={{ background: "#F0F7FD", border: "1.5px solid #D6EAF8", maxWidth: "400px" }}>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="flex-1 px-5 py-2 text-sm outline-none bg-transparent"
        />
        <span className="px-4 flex items-center" style={{ color: "#1B87C8" }}>🔍</span>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F0F7FD", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              {["Usuario", "Email", "Rol", "Estado", "Acciones"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "#555" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center" style={{ color: "#aaa" }}>Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center" style={{ color: "#aaa" }}>No se encontraron usuarios</td></tr>
            ) : filtrados.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{ background: roleColors[u.rol].color }}>
                      {u.nombre.charAt(0)}
                    </div>
                    <span className="font-semibold">{u.nombre}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm" style={{ color: "#555" }}>{u.email}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-1 rounded-full text-xs font-bold capitalize" style={roleColors[u.rol]}>{u.rol}</span>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleActivo(u)}
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: u.activo ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: u.activo ? "#16A34A" : "#DC2626" }}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => abrirEditar(u)} className="px-3 py-1 rounded text-xs font-bold" style={{ background: "#1B87C820", color: "#1B87C8" }}>Editar</button>
                    {u.id !== userActual.id && (
                      <button onClick={() => eliminar(u.id)} className="px-3 py-1 rounded text-xs font-bold" style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626" }}>Eliminar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl w-full max-w-md" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              <h3 className="font-black uppercase text-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {editando ? "Editar usuario" : "Nuevo usuario"}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ color: "#aaa", fontSize: "20px" }}>✕</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Nombre completo</label>
                <input style={inputStyle} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre y apellido" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={form.email}
                  disabled={!!editando}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@empresa.com"
                />
                {editando && <p className="text-xs mt-1" style={{ color: "#aaa" }}>El email no se puede modificar una vez creado el usuario.</p>}
              </div>
              {!editando && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Contraseña provisoria</label>
                  <input style={inputStyle} type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
                  <p className="text-xs mt-1" style={{ color: "#aaa" }}>Compartila con el usuario; podrá cambiarla luego.</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Rol</label>
                <select style={inputStyle} value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value as Usuario["rol"] }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Estado</label>
                <select style={inputStyle} value={form.activo ? "true" : "false"} onChange={e => setForm(f => ({ ...f, activo: e.target.value === "true" }))}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-lg font-bold text-sm" style={{ border: "1.5px solid rgba(0,0,0,0.1)", color: "#555" }}>Cancelar</button>
                <button onClick={guardar} disabled={guardando} className="flex-1 py-3 rounded-lg font-bold text-sm" style={{ background: "#1B87C8", color: "white" }}>
                  {guardando ? "Guardando..." : editando ? "Actualizar" : "Crear usuario"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}