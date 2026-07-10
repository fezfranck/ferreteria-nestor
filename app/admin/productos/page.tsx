"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Producto {
  id: number;
  nombre: string;
  marca: string;
  sku: string;
  precio: number;
  stock: number;
  icono: string;
  imagen_url: string | null;
  badge: string | null;
  activo: boolean;
  categoria_id: number;
}

const CATEGORIAS = [
  { id: 1, nombre: "Electricidad" },
  { id: 2, nombre: "Herramientas" },
  { id: 3, nombre: "Iluminación" },
  { id: 4, nombre: "Cables" },
  { id: 5, nombre: "Tableros" },
  { id: 6, nombre: "Seguridad" },
];

const ICONOS = ["⚡", "🔌", "📦", "💡", "🔧", "🪛", "🔨", "🪚", "🔩", "🛠️", "💰", "🏭"];

const vacío = {
  nombre: "", marca: "", sku: "", precio: 0,
  stock: 0, icono: "📦", imagen_url: null as string | null,
  badge: "", activo: true, categoria_id: 1,
};

export default function AdminProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState(vacío);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Nuevo: archivo de imagen seleccionado y estado de subida
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  useEffect(() => { fetchProductos(); }, []);

  async function fetchProductos() {
    const { data } = await supabase.from("productos").select("*").order("id");
    setProductos(data || []);
    setLoading(false);
  }

  function abrirNuevo() {
    setEditando(null);
    setForm(vacío);
    setArchivoImagen(null);
    setModalOpen(true);
  }

  function abrirEditar(p: Producto) {
    setEditando(p);
    setForm({
      nombre: p.nombre, marca: p.marca, sku: p.sku,
      precio: p.precio, stock: p.stock, icono: p.icono,
      imagen_url: p.imagen_url,
      badge: p.badge || "", activo: p.activo, categoria_id: p.categoria_id,
    });
    setArchivoImagen(null);
    setModalOpen(true);
  }

  // Sube el archivo seleccionado a Supabase Storage y devuelve la URL pública.
  // Si no hay archivo nuevo, devuelve la URL que ya tenía el producto (o null).
  async function subirImagen(sku: string): Promise<string | null> {
    if (!archivoImagen) return form.imagen_url;

    setSubiendoImagen(true);
    const extension = archivoImagen.name.split(".").pop();
    const nombreArchivo = `${sku || "producto"}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from("productos")
      .upload(nombreArchivo, archivoImagen, { upsert: true });

    setSubiendoImagen(false);

    if (error) {
      console.error("Error subiendo imagen:", error);
      return null;
    }

    const { data } = supabase.storage.from("productos").getPublicUrl(nombreArchivo);
    return data.publicUrl;
  }

  async function guardar() {
    setGuardando(true);

    const urlImagen = await subirImagen(form.sku);
    const datos = { ...form, badge: form.badge || null, imagen_url: urlImagen };

    let error;
    if (editando) {
      const res = await supabase.from("productos").update(datos).eq("id", editando.id);
      error = res.error;
    } else {
      const res = await supabase.from("productos").insert(datos);
      error = res.error;
    }

    if (error) {
      console.error("Error guardando producto:", error);
      setMensaje("❌ Error: " + error.message);
    } else {
      setMensaje(editando ? "Producto actualizado correctamente" : "Producto creado correctamente");
      setModalOpen(false);
      setArchivoImagen(null);
      fetchProductos();
    }

    setGuardando(false);
    setTimeout(() => setMensaje(""), 4000);
  }

  async function toggleActivo(p: Producto) {
    await supabase.from("productos").update({ activo: !p.activo }).eq("id", p.id);
    fetchProductos();
  }

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar este producto?")) return;
    await supabase.from("productos").delete().eq("id", id);
    fetchProductos();
  }

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.marca.toLowerCase().includes(busqueda.toLowerCase())
  );

  const inputStyle = {
    width: "100%", padding: "9px 12px", fontSize: "13px",
    borderRadius: "8px", border: "1.5px solid rgba(0,0,0,0.12)",
    outline: "none", background: "#fafafa",
  };

  return (
    <div>
      {/* Mensaje */}
      {mensaje && (
        <div
          className="rounded-lg px-4 py-3 mb-4 text-sm font-medium"
          style={{
            background: mensaje.startsWith("❌") ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)",
            color: mensaje.startsWith("❌") ? "#DC2626" : "#16A34A",
            border: mensaje.startsWith("❌") ? "1px solid rgba(220,38,38,0.2)" : "1px solid rgba(22,163,74,0.2)",
          }}
        >
          {mensaje.startsWith("❌") ? mensaje : `✅ ${mensaje}`}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="font-black uppercase text-4xl leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Gestión de <span style={{ color: "#1B87C8" }}>Productos</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "#555" }}>
            {productos.length} productos en total
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="px-5 py-2 rounded-lg font-bold text-sm transition-all"
          style={{ background: "#1B87C8", color: "white" }}
        >
          + Nuevo producto
        </button>
      </div>

      {/* Buscador */}
      <div
        className="flex rounded-full overflow-hidden mb-5"
        style={{ background: "#F0F7FD", border: "1.5px solid #D6EAF8", maxWidth: "400px" }}
      >
        <input
          type="text"
          placeholder="Buscar por nombre, SKU o marca..."
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
              {["Producto", "SKU", "Precio", "Stock", "Estado", "Acciones"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "#555" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center" style={{ color: "#aaa" }}>Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center" style={{ color: "#aaa" }}>No se encontraron productos</td></tr>
            ) : filtrados.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} className="w-9 h-9 object-cover rounded-lg" />
                    ) : (
                      <span className="text-2xl">{p.icono}</span>
                    )}
                    <div>
                      <div className="font-semibold">{p.nombre}</div>
                      <div className="text-xs" style={{ color: "#aaa" }}>{p.marca}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs font-mono" style={{ color: "#555" }}>{p.sku}</td>
                <td className="px-5 py-3 font-bold">${p.precio.toLocaleString("es-AR")}</td>
                <td className="px-5 py-3">
                  <span
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={{
                      background: p.stock > 10 ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                      color: p.stock > 10 ? "#16A34A" : "#DC2626",
                    }}
                  >
                    {p.stock} u.
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleActivo(p)}
                    className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: p.activo ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                      color: p.activo ? "#16A34A" : "#DC2626",
                    }}
                  >
                    {p.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="px-3 py-1 rounded text-xs font-bold transition-all"
                      style={{ background: "#1B87C820", color: "#1B87C8" }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminar(p.id)}
                      className="px-3 py-1 rounded text-xs font-bold transition-all"
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
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-screen overflow-y-auto" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              <h3
                className="font-black uppercase text-xl"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {editando ? "Editar producto" : "Nuevo producto"}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ color: "#aaa", fontSize: "20px" }}>✕</button>
            </div>
            <div className="p-6 flex flex-col gap-4">

              {/* Imagen del producto (reemplaza al selector de iconos) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Imagen del producto</label>

                <div className="flex items-center gap-4 mb-2">
                  {archivoImagen ? (
                    <img
                      src={URL.createObjectURL(archivoImagen)}
                      alt="Vista previa"
                      className="w-20 h-20 object-cover rounded-lg"
                      style={{ border: "1.5px solid rgba(0,0,0,0.1)" }}
                    />
                  ) : form.imagen_url ? (
                    <img
                      src={form.imagen_url}
                      alt="Vista previa"
                      className="w-20 h-20 object-cover rounded-lg"
                      style={{ border: "1.5px solid rgba(0,0,0,0.1)" }}
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-lg flex items-center justify-center text-3xl"
                      style={{ border: "1.5px solid rgba(0,0,0,0.1)", background: "#fafafa" }}
                    >
                      {form.icono}
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setArchivoImagen(e.target.files?.[0] || null)}
                      className="text-sm"
                    />
                    {subiendoImagen && (
                      <p className="text-xs mt-1" style={{ color: "#1B87C8" }}>Subiendo imagen...</p>
                    )}
                    {!form.imagen_url && !archivoImagen && (
                      <p className="text-xs mt-1" style={{ color: "#aaa" }}>
                        Sin imagen todavía — se usará el ícono como respaldo.
                      </p>
                    )}
                  </div>
                </div>

                {/* Selector de icono de respaldo, para productos sin foto */}
                <label className="block text-xs font-bold uppercase tracking-wide mb-2 mt-3">
                  Icono de respaldo
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICONOS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => setForm(f => ({ ...f, icono: ic }))}
                      className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all"
                      style={{
                        border: form.icono === ic ? "2px solid #1B87C8" : "1.5px solid rgba(0,0,0,0.1)",
                        background: form.icono === ic ? "#F0F7FD" : "white",
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Nombre</label>
                  <input style={inputStyle} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del producto" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Marca</label>
                  <input style={inputStyle} value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} placeholder="Marca" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">SKU</label>
                  <input style={inputStyle} value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="SKU-001" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Categoría</label>
                  <select style={inputStyle} value={form.categoria_id} onChange={e => setForm(f => ({ ...f, categoria_id: Number(e.target.value) }))}>
                    {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Precio</label>
                  <input style={inputStyle} type="number" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: Number(e.target.value) }))} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Stock</label>
                  <input style={inputStyle} type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Badge</label>
                  <select style={inputStyle} value={form.badge || ""} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}>
                    <option value="">Sin badge</option>
                    <option value="Oferta">Oferta</option>
                    <option value="Nuevo">Nuevo</option>
                    <option value="Destacado">Destacado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Estado</label>
                  <select style={inputStyle} value={form.activo ? "true" : "false"} onChange={e => setForm(f => ({ ...f, activo: e.target.value === "true" }))}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
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
                  disabled={guardando || subiendoImagen}
                  className="flex-1 py-3 rounded-lg font-bold text-sm transition-all"
                  style={{ background: "#1B87C8", color: "white" }}
                >
                  {guardando ? "Guardando..." : editando ? "Actualizar" : "Crear producto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}