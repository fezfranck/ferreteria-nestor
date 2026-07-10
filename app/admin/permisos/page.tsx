"use client";
import { useState } from "react";

interface Permiso {
  id: string;
  nombre: string;
  categoria: string;
  rolesPermitidos: string[];
}

const ROLES = [
  { id: "superadmin", nombre: "Super Admin", color: "#805AD5", desc: "Control total del sistema" },
  { id: "admin", nombre: "Administrador", color: "#1B87C8", desc: "Gestión de catálogo y pedidos" },
  { id: "vendedor", nombre: "Vendedor", color: "#38A169", desc: "Gestión de pedidos y ventas" },
  { id: "comprador", nombre: "Comprador", color: "#D69E2E", desc: "Visualización y compra" },
];

const PERMISOS_INICIALES: Permiso[] = [
  // Productos
  { id: "prod_ver", nombre: "Ver productos en catálogo", categoria: "Catálogo de Productos", rolesPermitidos: ["superadmin", "admin", "vendedor", "comprador"] },
  { id: "prod_crear", nombre: "Crear nuevos productos", categoria: "Catálogo de Productos", rolesPermitidos: ["superadmin", "admin"] },
  { id: "prod_editar", nombre: "Editar productos existentes", categoria: "Catálogo de Productos", rolesPermitidos: ["superadmin", "admin"] },
  { id: "prod_eliminar", nombre: "Eliminar productos", categoria: "Catálogo de Productos", rolesPermitidos: ["superadmin"] },

  // Pedidos
  { id: "ped_ver", nombre: "Ver lista de pedidos", categoria: "Gestión de Pedidos", rolesPermitidos: ["superadmin", "admin", "vendedor"] },
  { id: "ped_cambiar_estado", nombre: "Actualizar estado del pedido", categoria: "Gestión de Pedidos", rolesPermitidos: ["superadmin", "admin", "vendedor"] },
  { id: "ped_eliminar", nombre: "Eliminar pedidos del sistema", categoria: "Gestión de Pedidos", rolesPermitidos: ["superadmin"] },

  // Usuarios
  { id: "usr_ver", nombre: "Ver usuarios registrados", categoria: "Seguridad y Usuarios", rolesPermitidos: ["superadmin"] },
  { id: "usr_gestionar", nombre: "Crear, editar o suspender usuarios", categoria: "Seguridad y Usuarios", rolesPermitidos: ["superadmin"] },

  // Sistema
  { id: "sys_erpsync", nombre: "Forzar sincronización con DUX ERP", categoria: "Configuración del Sistema", rolesPermitidos: ["superadmin"] },
  { id: "sys_config", nombre: "Configuración general de la tienda", categoria: "Configuración del Sistema", rolesPermitidos: ["superadmin"] },
];

export default function AdminPermisos() {
  const [permisos, setPermisos] = useState<Permiso[]>(PERMISOS_INICIALES);
  const [mensaje, setMensaje] = useState("");
  const [rolSeleccionado, setRolSeleccionado] = useState("all");

  const categorias = Array.from(new Set(permisos.map(p => p.categoria)));

  function togglePermiso(permisoId: string, rolId: string) {
    setPermisos(prev =>
      prev.map(p => {
        if (p.id === permisoId) {
          const tienePermiso = p.rolesPermitidos.includes(rolId);
          const nuevosRoles = tienePermiso
            ? p.rolesPermitidos.filter(r => r !== rolId)
            : [...p.rolesPermitidos, rolId];
          return { ...p, rolesPermitidos: nuevosRoles };
        }
        return p;
      })
    );
    setMensaje("Permisos actualizados de manera local temporal.");
    setTimeout(() => setMensaje(""), 3000);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Mensaje */}
      {mensaje && (
        <div
          className="rounded-lg px-4 py-3 text-sm font-medium transition-all animate-fade-in"
          style={{ background: "rgba(22,163,74,0.08)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.2)" }}
        >
          ✅ {mensaje}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-black uppercase text-4xl leading-none text-[#1A1A1A]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Matriz de <span style={{ color: "#1B87C8" }}>Permisos</span>
          </h1>
          <p className="text-sm mt-1 text-gray-500">
            Define qué roles pueden realizar cada acción dentro del panel de control
          </p>
        </div>
      </div>

      {/* Selector de Rol */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-black/5">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Filtrar Vista:</span>
        <button
          onClick={() => setRolSeleccionado("all")}
          className="text-xs font-bold px-3 py-1.5 rounded-full border transition-all"
          style={
            rolSeleccionado === "all"
              ? { background: "#1B87C8", color: "white", borderColor: "#1B87C8" }
              : { background: "white", color: "#555", borderColor: "rgba(0,0,0,0.1)" }
          }
        >
          Ver Matriz Completa
        </button>
        {ROLES.map(r => (
          <button
            key={r.id}
            onClick={() => setRolSeleccionado(r.id)}
            className="text-xs font-bold px-3 py-1.5 rounded-full border transition-all"
            style={
              rolSeleccionado === r.id
                ? { background: r.color, color: "white", borderColor: r.color }
                : { background: "white", color: "#555", borderColor: "rgba(0,0,0,0.1)" }
            }
          >
            {r.nombre}
          </button>
        ))}
      </div>

      {/* Tabla e info general */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Tabla Matriz */}
        <div
          className="xl:col-span-3 bg-white rounded-xl overflow-hidden self-start"
          style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
        >
          <table className="w-full text-sm text-left">
            <thead>
              <tr style={{ background: "#F0F7FD", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-600 w-1/2">
                  Acción / Permiso del Sistema
                </th>
                {ROLES.filter(r => rolSeleccionado === "all" || r.id === rolSeleccionado).map(r => (
                  <th key={r.id} className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-center text-gray-600">
                    <div className="flex flex-col items-center">
                      <span style={{ color: r.color }}>{r.nombre}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categorias.map(cat => (
                <div key={cat} className="contents">
                  {/* Fila separadora de Categoría */}
                  <tr className="bg-gray-50/50">
                    <td 
                      colSpan={(rolSeleccionado === "all" ? ROLES.length : 1) + 1} 
                      className="px-6 py-2.5 text-xs font-black uppercase text-gray-400 tracking-wider"
                    >
                      📁 {cat}
                    </td>
                  </tr>

                  {/* Permisos de esta categoría */}
                  {permisos.filter(p => p.categoria === cat).map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{p.nombre}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{p.id}</div>
                      </td>
                      {ROLES.filter(r => rolSeleccionado === "all" || r.id === rolSeleccionado).map(r => {
                        const activo = p.rolesPermitidos.includes(r.id);
                        return (
                          <td key={r.id} className="px-4 py-4 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={activo}
                                onChange={() => togglePermiso(p.id, r.id)}
                                className="sr-only peer"
                              />
                              <div 
                                className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#1B87C8]/20 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all relative peer-checked:bg-primary"
                                style={{
                                  backgroundColor: activo ? r.color : undefined
                                }}
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </div>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tarjetas Informativas de Roles */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div 
            className="bg-white rounded-xl p-5 border flex flex-col gap-4"
            style={{ borderColor: "rgba(0,0,0,0.08)" }}
          >
            <h3 className="font-black text-xl uppercase text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Roles en el Sistema
            </h3>
            <div className="flex flex-col gap-4">
              {ROLES.map(r => (
                <div key={r.id} className="flex gap-3 items-start border-b pb-3 last:border-0 last:pb-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                    style={{ background: r.color }}
                  >
                    {r.nombre.charAt(0)}
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-gray-800">{r.nombre}</div>
                    <div className="text-gray-400 font-mono mb-1">{r.id}</div>
                    <p className="text-gray-500 leading-snug">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="bg-[#F0F7FD] rounded-xl p-5 border text-xs leading-relaxed text-[#1B87C8] border-[#D6EAF8]"
          >
            <span className="font-bold block mb-1">💡 Información Técnica:</span>
            Los cambios realizados en esta interfaz modifican temporalmente el estado local del cliente de administración. La base de datos persistirá estos privilegios mediante políticas RLS (Row Level Security) y metadatos de Supabase Auth en la próxima sincronización de entorno.
          </div>
        </div>

      </div>
    </div>
  );
}
