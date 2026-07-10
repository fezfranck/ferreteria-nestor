"use client";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: "superadmin" | "admin" | "vendedor" | "comprador";
  activo: boolean;
  creado: string;
}

const ROLES = ["superadmin", "admin", "vendedor", "comprador"];

const roleColors: Record<string, { bg: string; color: string }> = {
  superadmin: { bg: "rgba(128,90,213,0.1)", color: "#805AD5" },
  admin: { bg: "rgba(27,135,200,0.1)", color: "#1B87C8" },
  vendedor: { bg: "rgba(56,161,105,0.1)", color: "#38A169" },
  comprador: { bg: "rgba(214,158,46,0.1)", color: "#D69E2E" },
};

const USUARIOS_INICIALES: Usuario[] = [
  { id: "1", nombre: "Nestor Admin", email: "admin@nestor.com", rol: "superadmin", activo: true, creado: "2024-01-01" },
  { id: "2", nombre: "Maria Lopez", email: "maria@nestor.com", rol: "admin", activo: true, creado: "2024-03-15" },
  { id: "3", nombre: "Carlos Ruiz", email: "carlos@nestor.com", rol: "vendedor", activo: true, creado: "2024-06-10" },
];

const vacío: {
  nombre: string;
  email: string;
  rol: "superadmin" | "admin" | "vendedor" | "comprador";
  activo: boolean;
} = { nombre: "", email: "", rol: "comprador", activo: true };

export default function AdminUsuarios() {
  const { user: userActual } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_INICIALES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState(vacío);
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");

  function abrirNuevo() {
    setEditando(null);
    setForm(vacío);
    setModalOpen(true);
  }

  function abrirEditar(u: Usuario) {
    setEditando(u);
    setForm({ nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo });
    setModalOpen(true);
  }

  function guardar() {
    if (editando) {
      setUsuarios(prev => prev.map(u =>
        u.id === editando.id ? { ...u, ...form } : u
      ));
      setMensaje("Usuario actualizado correctamente");
    } else {
      const nuevo: Usuario = {
        id: Date.now().toString(),
        ...form,
        creado: new Date().toISOString().split("T")[0],
      };
      setUsuarios(prev => [...prev, nuevo]);
      setMensaje("Usuario creado correctamente");
    }
    setModalOpen(false);
    setTimeout(() => setMensaje(""), 3000);
  }

  function toggleActivo(id: string) {
    setUsuarios(prev => prev.map(u =>
      u.id === id ? { ...u, activo: !u.activo } : u
    ));
  }

  function eliminar(id: string) {
    if (!confirm("Eliminar este usuario?")) return;
    setUsuarios(prev => prev.filter(u => u.id !== id));
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
        <h2
          className="font-black uppercase text-3xl mb-2"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
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
          style={{ background: "rgba(22,163,74,0.08)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.2)" }}
        >
          ✅ {mensaje}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="font-black uppercase text-4xl leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Gestión de <span style={{ color: "#1B87C8" }}>Usuarios</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "#555" }}>
            {usuarios.length} usuarios registrados
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="px-5 py-2 rounded-lg font-bold text-sm"
          style={{ background: "#1B87C8", color: "white" }}
        >
          + Nuevo usuario
        </button>
      </div>

      {/* Stats por rol */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {ROLES.map(rol => (
          <div
            key={rol}
            className="bg-white rounded-xl p-4 text-center"
            style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
          >
            <div
              className="font-black text-3xl mb-1"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: roleColors[rol].color }}
            >
              {usuarios.filter(u => u.rol === rol).length}
            </div>
            <div className="text-xs font-bold uppercase capitalize" style={{ color: "#555" }}>{rol}</div>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div
        className="flex rounded-full overflow-hidden mb-5"
        style={{ background: "#F0F7FD", border: "1.5px solid #D6EAF8", maxWidth: "400px" }}
      >
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="flex-1 px-5 py-2 text-sm outline-none bg-transparent"
        />
        <span className="px-4 flex items-center" style={{ color: "#1B87C8" }}>🔍</span>
      </div>

      {/* Tabla */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F0F7FD", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              {["Usuario", "Email", "Rol", "Estado", "Creado", "Acciones"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "#555" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                      style={{ background: roleColors[u.rol].color }}
                    >
                      {u.nombre.charAt(0)}
                    </div>
                    <span className="font-semibold">{u.nombre}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm" style={{ color: "#555" }}>{u.email}</td>
                <td className="px-5 py-3">
                  <span
                    className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                    style={roleColors[u.rol]}
                  >
                    {u.rol}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleActivo(u.id)}
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: u.activo ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                      color: u.activo ? "#16A34A" : "#DC2626",
                    }}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-5 py-3 text-xs" style={{ color: "#aaa" }}>{u.creado}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirEditar(u)}
                      className="px-3 py-1 rounded text-xs font-bold"
                      style={{ background: "#1B87C820", color: "#1B87C8" }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminar(u.id)}
                      className="px-3 py-1 rounded text-xs font-bold"
                      style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626" }}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl w-full max-w-md" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
            >
              <h3
                className="font-black uppercase text-xl"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {editando ? "Editar usuario" : "Nuevo usuario"}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ color: "#aaa", fontSize: "20px" }}>✕</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Nombre completo</label>
                <input
                  style={inputStyle}
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre y apellido"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@empresa.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Rol</label>
                <select
                  style={inputStyle}
                  value={form.rol}
                  onChange={e => setForm(f => ({ ...f, rol: e.target.value as typeof form.rol }))}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Estado</label>
                <select
                  style={inputStyle}
                  value={form.activo ? "true" : "false"}
                  onChange={e => setForm(f => ({ ...f, activo: e.target.value === "true" }))}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-lg font-bold text-sm"
                  style={{ border: "1.5px solid rgba(0,0,0,0.1)", color: "#555" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  className="flex-1 py-3 rounded-lg font-bold text-sm"
                  style={{ background: "#1B87C8", color: "white" }}
                >
                  {editando ? "Actualizar" : "Crear usuario"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}