"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  Categoria,
  CATEGORIAS_DEFAULT,
  obtenerCategorias,
  crearCategoria,
  eliminarCategoria,
} from "../../lib/categorias";

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

const ICONOS = ["⚡", "🔌", "📦", "💡", "🔧", "🪛", "🔨", "🪚", "🔩", "🛠️", "💰", "🏭"];
const EMOJIS_CATEGORIAS = ["⚡", "🔨", "💡", "🔌", "📋", "🦺", "🎨", "🚿", "🪛", "🧱", "📏", "📦", "🧰", "🔩", "⚙️"];

const vacío = {
  nombre: "",
  marca: "",
  sku: "",
  precio: 0,
  stock: 0,
  icono: "📦",
  imagen_url: null as string | null,
  badge: "",
  activo: true,
  categoria_id: 1,
};

export default function AdminProductos() {
  const { user } = useAuth();
  const puedeGestionarMasivo = user?.rol === "admin" || user?.rol === "superadmin";

  // Productos y Categorías
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>(CATEGORIAS_DEFAULT);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | "todas">("todas");

  // Selección Masiva
  const [seleccionados, setSeleccionados] = useState<number[]>([]);

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPreciosOpen, setModalPreciosOpen] = useState(false);
  const [modalEliminarMasivoOpen, setModalEliminarMasivoOpen] = useState(false);
  const [modalCategoriasOpen, setModalCategoriasOpen] = useState(false);

  // Estado del Formulario de Producto Individual
  const [editando, setEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState(vacío);
  const [guardando, setGuardando] = useState(false);
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // Estado del Modal de Precios Masivos
  const [alcancePrecios, setAlcancePrecios] = useState<"seleccionados" | "todos" | "categoria">("seleccionados");
  const [categoriaPreciosId, setCategoriaPreciosId] = useState<number>(1);
  const [tipoAjuste, setTipoAjuste] = useState<"aumentar" | "disminuir">("aumentar");
  const [porcentajeAjuste, setPorcentajeAjuste] = useState<number>(10);
  const [redondearEnteros, setRedondearEnteros] = useState<boolean>(true);
  const [aplicandoPrecios, setAplicandoPrecios] = useState(false);

  // Estado de Eliminación Masiva
  const [eliminandoMasivo, setEliminandoMasivo] = useState(false);

  // Estado de Creación de Categorías
  const [nuevoNombreCategoria, setNuevoNombreCategoria] = useState("");
  const [nuevoEmojiCategoria, setNuevoEmojiCategoria] = useState("📦");
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [errorCategoria, setErrorCategoria] = useState("");

  // Notificaciones
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    await Promise.all([fetchProductos(), fetchCategorias()]);
    setLoading(false);
  }

  async function fetchProductos() {
    const { data, error } = await supabase.from("productos").select("*").order("id");
    if (!error && data) {
      setProductos(data);
    }
  }

  async function fetchCategorias() {
    const cats = await obtenerCategorias();
    setCategorias(cats);
  }

  function mostrarNotificacion(texto: string) {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 5000);
  }

  // -----------------------------------------------------------------
  // SELECCIÓN MASIVA CON SELECTOR
  // -----------------------------------------------------------------
  const filtrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideBusqueda =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.marca.toLowerCase().includes(busqueda.toLowerCase());

      const coincideCategoria =
        categoriaFiltro === "todas" || p.categoria_id === categoriaFiltro;

      return coincideBusqueda && coincideCategoria;
    });
  }, [productos, busqueda, categoriaFiltro]);

  const todosSeleccionados =
    filtrados.length > 0 && filtrados.every((p) => seleccionados.includes(p.id));

  const algunosSeleccionados =
    filtrados.some((p) => seleccionados.includes(p.id)) && !todosSeleccionados;

  function toggleSeleccionarTodos() {
    if (todosSeleccionados) {
      // Deseleccionar los visibles actuales
      const idsFiltrados = new Set(filtrados.map((p) => p.id));
      setSeleccionados((prev) => prev.filter((id) => !idsFiltrados.has(id)));
    } else {
      // Seleccionar todos los visibles
      const idsNuevos = filtrados.map((p) => p.id);
      setSeleccionados((prev) => Array.from(new Set([...prev, ...idsNuevos])));
    }
  }

  function toggleSeleccionarUno(id: number) {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function deseleccionarTodos() {
    setSeleccionados([]);
  }

  // -----------------------------------------------------------------
  // ACCIONES MASIVAS: ELIMINACIÓN
  // -----------------------------------------------------------------
  async function confirmarEliminacionMasiva() {
    if (seleccionados.length === 0) return;
    setEliminandoMasivo(true);

    try {
      const { error } = await supabase
        .from("productos")
        .delete()
        .in("id", seleccionados);

      if (error) {
        mostrarNotificacion(`❌ Error al eliminar productos: ${error.message}`);
      } else {
        const cantidad = seleccionados.length;
        mostrarNotificacion(`✅ Se eliminaron ${cantidad} productos correctamente.`);
        setSeleccionados([]);
        setModalEliminarMasivoOpen(false);
        await fetchProductos();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      mostrarNotificacion(`❌ Error inesperado: ${errorMsg}`);
    } finally {
      setEliminandoMasivo(false);
    }
  }

  async function eliminarIndividual(id: number) {
    if (!confirm("¿Eliminar este producto?")) return;
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) {
      mostrarNotificacion(`❌ Error al eliminar: ${error.message}`);
    } else {
      mostrarNotificacion("✅ Producto eliminado correctamente");
      setSeleccionados((prev) => prev.filter((item) => item !== id));
      await fetchProductos();
    }
  }

  // -----------------------------------------------------------------
  // ACCIONES MASIVAS: MODIFICACIÓN DE PRECIOS POR PORCENTAJE
  // -----------------------------------------------------------------
  function abrirModalPrecios(alcanceInicial?: "seleccionados" | "todos" | "categoria") {
    if (alcanceInicial) {
      setAlcancePrecios(alcanceInicial);
    } else if (seleccionados.length > 0) {
      setAlcancePrecios("seleccionados");
    } else {
      setAlcancePrecios("todos");
    }
    setModalPreciosOpen(true);
  }

  // Lista de productos destino según el alcance seleccionado
  const productosObjetivoPrecios = useMemo(() => {
    if (alcancePrecios === "seleccionados") {
      const setSel = new Set(seleccionados);
      return productos.filter((p) => setSel.has(p.id));
    }
    if (alcancePrecios === "categoria") {
      return productos.filter((p) => p.categoria_id === categoriaPreciosId);
    }
    return productos;
  }, [productos, alcancePrecios, seleccionados, categoriaPreciosId]);

  // Cálculo del nuevo precio
  function calcularNuevoPrecio(precioActual: number): number {
    const factor = tipoAjuste === "aumentar" ? 1 + porcentajeAjuste / 100 : 1 - porcentajeAjuste / 100;
    const nuevo = precioActual * factor;
    const finalVal = redondearEnteros ? Math.round(nuevo) : Math.round(nuevo * 100) / 100;
    return Math.max(1, finalVal);
  }

  async function aplicarModificacionPrecios() {
    if (productosObjetivoPrecios.length === 0) {
      mostrarNotificacion("❌ No hay productos seleccionados para actualizar precios.");
      return;
    }
    if (porcentajeAjuste <= 0 || isNaN(porcentajeAjuste)) {
      mostrarNotificacion("❌ Ingresá un porcentaje mayor a 0.");
      return;
    }

    setAplicandoPrecios(true);

    try {
      // Actualizar en lotes de 40 para evitar sobrecarga
      const tamanoLote = 40;
      let totalActualizados = 0;

      for (let i = 0; i < productosObjetivoPrecios.length; i += tamanoLote) {
        const lote = productosObjetivoPrecios.slice(i, i + tamanoLote);

        await Promise.all(
          lote.map((p) => {
            const nuevoPrecio = calcularNuevoPrecio(p.precio);
            return supabase
              .from("productos")
              .update({ precio: nuevoPrecio })
              .eq("id", p.id);
          })
        );

        totalActualizados += lote.length;
      }

      const signo = tipoAjuste === "aumentar" ? "+" : "-";
      mostrarNotificacion(
        `✅ Precios actualizados para ${totalActualizados} productos (${signo}${porcentajeAjuste}%).`
      );
      setModalPreciosOpen(false);
      setSeleccionados([]);
      await fetchProductos();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      mostrarNotificacion(`❌ Error al actualizar precios: ${errorMsg}`);
    } finally {
      setAplicandoPrecios(false);
    }
  }

  // -----------------------------------------------------------------
  // GESTIÓN DE CATEGORÍAS
  // -----------------------------------------------------------------
  async function handleCrearCategoria() {
    if (!nuevoNombreCategoria.trim()) {
      setErrorCategoria("El nombre de la categoría es obligatorio.");
      return;
    }
    setGuardandoCategoria(true);
    setErrorCategoria("");

    const res = await crearCategoria(nuevoNombreCategoria, nuevoEmojiCategoria);
    if (!res.success) {
      setErrorCategoria(res.error || "Error al crear categoría.");
    } else {
      setNuevoNombreCategoria("");
      setNuevoEmojiCategoria("📦");
      await fetchCategorias();
      mostrarNotificacion(`✅ Categoría "${res.categoria?.nombre}" creada correctamente.`);
    }
    setGuardandoCategoria(false);
  }

  async function handleEliminarCategoria(cat: Categoria) {
    if (!confirm(`¿Deseás eliminar la categoría "${cat.nombre}"?`)) return;

    const res = await eliminarCategoria(cat.id);
    if (!res.success) {
      alert(res.error || "No se pudo eliminar la categoría.");
    } else {
      mostrarNotificacion(`✅ Categoría "${cat.nombre}" eliminada.`);
      await fetchCategorias();
    }
  }

  // -----------------------------------------------------------------
  // FORMULARIO INDIVIDUAL
  // -----------------------------------------------------------------
  function abrirNuevo() {
    setEditando(null);
    setForm({
      ...vacío,
      categoria_id: categorias[0]?.id || 1,
    });
    setArchivoImagen(null);
    setModalOpen(true);
  }

  function abrirEditar(p: Producto) {
    setEditando(p);
    setForm({
      nombre: p.nombre,
      marca: p.marca,
      sku: p.sku,
      precio: p.precio,
      stock: p.stock,
      icono: p.icono,
      imagen_url: p.imagen_url,
      badge: p.badge || "",
      activo: p.activo,
      categoria_id: p.categoria_id,
    });
    setArchivoImagen(null);
    setModalOpen(true);
  }

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
      mostrarNotificacion("❌ Error: " + error.message);
    } else {
      mostrarNotificacion(
        editando ? "Producto actualizado correctamente" : "Producto creado correctamente"
      );
      setModalOpen(false);
      setArchivoImagen(null);
      await fetchProductos();
    }

    setGuardando(false);
  }

  async function toggleActivo(p: Producto) {
    await supabase.from("productos").update({ activo: !p.activo }).eq("id", p.id);
    fetchProductos();
  }

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    fontSize: "13px",
    borderRadius: "8px",
    border: "1.5px solid rgba(0,0,0,0.12)",
    outline: "none",
    background: "#fafafa",
  };

  return (
    <div className="pb-24">
      {/* Notificación Flotante / Banner */}
      {mensaje && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-sm font-semibold flex items-center justify-between shadow-xs transition-all animate-in fade-in"
          style={{
            background: mensaje.startsWith("❌") ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)",
            color: mensaje.startsWith("❌") ? "#DC2626" : "#16A34A",
            border: mensaje.startsWith("❌")
              ? "1px solid rgba(220,38,38,0.2)"
              : "1px solid rgba(22,163,74,0.2)",
          }}
        >
          <span>{mensaje}</span>
          <button
            onClick={() => setMensaje("")}
            className="text-xs px-2 py-0.5 rounded hover:bg-black/5 opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="font-black uppercase text-3xl sm:text-4xl leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Gestión de <span style={{ color: "#1B87C8" }}>Productos</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "#555" }}>
            {productos.length} productos en catálogo • {filtrados.length} visibles
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2.5">
          {puedeGestionarMasivo && (
            <>
              {/* Botón Gestión de Categorías */}
              <button
                type="button"
                onClick={() => setModalCategoriasOpen(true)}
                className="px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all border border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100 flex items-center gap-1.5 shadow-xs"
                title="Crear y administrar categorías"
              >
                <span>🏷️</span> Categorías ({categorias.length})
              </button>

              {/* Botón Ajuste Masivo de Precios */}
              <button
                type="button"
                onClick={() => abrirModalPrecios()}
                className="px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 shadow-xs"
                title="Ajuste masivo de precios por porcentaje"
              >
                <span>💲</span> Precios (%)
              </button>
            </>
          )}

          <Link
            href="/admin/productos/importar"
            className="px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all border border-[#1B87C8] text-[#1B87C8] bg-white hover:bg-[#F0F7FD] flex items-center gap-1.5 shadow-xs"
          >
            <span>📥</span> Carga masiva
          </Link>

          <button
            onClick={abrirNuevo}
            className="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs hover:brightness-105 text-white flex items-center gap-1"
            style={{ background: "#1B87C8" }}
          >
            <span>+</span> Nuevo producto
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        {/* Buscador */}
        <div
          className="flex-1 flex rounded-full overflow-hidden"
          style={{ background: "#F0F7FD", border: "1.5px solid #D6EAF8" }}
        >
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o marca..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent"
          />
          <span className="px-4 flex items-center" style={{ color: "#1B87C8" }}>
            🔍
          </span>
        </div>

        {/* Filtro por Categoría */}
        <div className="flex items-center gap-2 sm:w-64">
          <select
            value={categoriaFiltro}
            onChange={(e) =>
              setCategoriaFiltro(e.target.value === "todas" ? "todas" : Number(e.target.value))
            }
            className="w-full px-3 py-2 text-sm rounded-xl font-semibold outline-none bg-white border border-black/10 text-gray-700 shadow-xs"
          >
            <option value="todas">Todas las categorías ({productos.length})</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji || "📦"} {cat.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* BARRA FLOTANTE DE ACCIONES MASIVAS (cuando hay selector activo) */}
      {puedeGestionarMasivo && seleccionados.length > 0 && (
        <div
          className="sticky top-4 z-30 mb-4 p-3 sm:p-4 rounded-2xl bg-white border-2 border-[#1B87C8] shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#1B87C8] text-white font-black text-sm flex items-center justify-center">
              {seleccionados.length}
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">
                {seleccionados.length} {seleccionados.length === 1 ? "producto seleccionado" : "productos seleccionados"}
              </p>
              <button
                type="button"
                onClick={deseleccionarTodos}
                className="text-xs text-[#1B87C8] font-semibold hover:underline mt-0.5 block"
              >
                Deseleccionar todos
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => abrirModalPrecios("seleccionados")}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-all flex items-center gap-1.5"
            >
              <span>📈</span> Ajustar Precios (%)
            </button>

            <button
              type="button"
              onClick={() => setModalEliminarMasivoOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-red-50 text-red-700 border border-red-300 hover:bg-red-100 transition-all flex items-center gap-1.5"
            >
              <span>🗑️</span> Eliminar seleccionados
            </button>
          </div>
        </div>
      )}

      {/* TABLA DE PRODUCTOS */}
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-xs"
        style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F0F7FD", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                {/* SELECTOR MASIVO HEADER */}
                {puedeGestionarMasivo && (
                  <th className="px-4 py-3.5 text-center w-12">
                    <input
                      type="checkbox"
                      checked={todosSeleccionados}
                      ref={(el) => {
                        if (el) el.indeterminate = algunosSeleccionados;
                      }}
                      onChange={toggleSeleccionarTodos}
                      className="w-4 h-4 rounded border-gray-300 text-[#1B87C8] focus:ring-[#1B87C8] cursor-pointer"
                      title="Seleccionar / deseleccionar todos los visibles"
                    />
                  </th>
                )}
                {["Producto", "Categoría", "SKU", "Precio", "Stock", "Estado", "Acciones"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide"
                    style={{ color: "#555" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={puedeGestionarMasivo ? 8 : 7}
                    className="px-5 py-12 text-center"
                    style={{ color: "#aaa" }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl animate-spin">⚡</span>
                      <span>Cargando productos...</span>
                    </div>
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={puedeGestionarMasivo ? 8 : 7}
                    className="px-5 py-12 text-center"
                    style={{ color: "#aaa" }}
                  >
                    No se encontraron productos coincidentes
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => {
                  const estaSeleccionado = seleccionados.includes(p.id);
                  const categoriaObj = categorias.find((c) => c.id === p.categoria_id);

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        estaSeleccionado ? "bg-[#F0F7FD]/70" : "hover:bg-gray-50/70"
                      }`}
                      style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                    >
                      {/* CHECKBOX INDIVIDUAL */}
                      {puedeGestionarMasivo && (
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={estaSeleccionado}
                            onChange={() => toggleSeleccionarUno(p.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#1B87C8] focus:ring-[#1B87C8] cursor-pointer"
                          />
                        </td>
                      )}

                      {/* PRODUCTO */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.imagen_url ? (
                            <img
                              src={p.imagen_url}
                              alt={p.nombre}
                              className="w-10 h-10 object-cover rounded-lg border border-black/5 flex-shrink-0"
                            />
                          ) : (
                            <span className="text-2xl w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg flex-shrink-0">
                              {p.icono}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate max-w-xs sm:max-w-md">
                              {p.nombre}
                            </div>
                            <div className="text-xs" style={{ color: "#888" }}>
                              {p.marca || "Sin marca"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORÍA */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                          <span>{categoriaObj?.emoji || "📦"}</span>
                          <span>{categoriaObj?.nombre || "Sin cat."}</span>
                        </span>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">{p.sku}</td>

                      {/* PRECIO */}
                      <td className="px-4 py-3 font-bold text-gray-900">
                        ${p.precio.toLocaleString("es-AR")}
                      </td>

                      {/* STOCK */}
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold inline-block"
                          style={{
                            background: p.stock > 10 ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                            color: p.stock > 10 ? "#16A34A" : "#DC2626",
                          }}
                        >
                          {p.stock} u.
                        </span>
                      </td>

                      {/* ESTADO */}
                      <td className="px-4 py-3">
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

                      {/* ACCIONES */}
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirEditar(p)}
                            className="px-2.5 py-1 rounded text-xs font-bold transition-all"
                            style={{ background: "#1B87C820", color: "#1B87C8" }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminarIndividual(p.id)}
                            className="px-2.5 py-1 rounded text-xs font-bold transition-all"
                            style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626" }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODAL 1: MODIFICACIÓN MASIVA DE PRECIOS POR PORCENTAJE        */}
      {/* ============================================================= */}
      {modalPreciosOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          >
            {/* Cabecera */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
            >
              <div>
                <h3
                  className="font-black uppercase text-xl text-gray-900"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  💲 Modificar Precios de Forma Masiva
                </h3>
                <p className="text-xs text-gray-500">
                  Subí o bajá los precios por porcentaje a productos seleccionados o por categoría
                </p>
              </div>
              <button
                onClick={() => setModalPreciosOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* 1. Alcance de la modificación */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                  1. ¿A qué productos aplicar el cambio?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAlcancePrecios("seleccionados")}
                    disabled={seleccionados.length === 0}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      alcancePrecios === "seleccionados"
                        ? "bg-[#F0F7FD] border-[#1B87C8] text-[#1B87C8] font-bold"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    } ${seleccionados.length === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <div className="text-xs uppercase font-bold">Seleccionados</div>
                    <div className="text-base font-black">{seleccionados.length} prod.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAlcancePrecios("todos")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      alcancePrecios === "todos"
                        ? "bg-[#F0F7FD] border-[#1B87C8] text-[#1B87C8] font-bold"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="text-xs uppercase font-bold">Todo el Catálogo</div>
                    <div className="text-base font-black">{productos.length} prod.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAlcancePrecios("categoria")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      alcancePrecios === "categoria"
                        ? "bg-[#F0F7FD] border-[#1B87C8] text-[#1B87C8] font-bold"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="text-xs uppercase font-bold">Por Categoría</div>
                    <div className="text-sm font-semibold truncate">Elegir categoría</div>
                  </button>
                </div>

                {/* Si seleccionó por categoría, mostrar selector */}
                {alcancePrecios === "categoria" && (
                  <div className="mt-3">
                    <select
                      value={categoriaPreciosId}
                      onChange={(e) => setCategoriaPreciosId(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-xl font-semibold bg-white border border-gray-300 text-gray-700 shadow-xs"
                    >
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.emoji || "📦"} {c.nombre} (
                          {productos.filter((p) => p.categoria_id === c.id).length} productos)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 2. Dirección del cambio: Aumento (+) o Descuento (-) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                  2. Tipo de cambio
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoAjuste("aumentar")}
                    className={`py-2.5 px-4 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-all ${
                      tipoAjuste === "aumentar"
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span>📈</span> Subir precios (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoAjuste("disminuir")}
                    className={`py-2.5 px-4 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-all ${
                      tipoAjuste === "disminuir"
                        ? "bg-red-500 text-white border-red-600 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span>📉</span> Bajar precios (-)
                  </button>
                </div>
              </div>

              {/* 3. Porcentaje */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                  3. Porcentaje a {tipoAjuste === "aumentar" ? "subir" : "bajar"} (%)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      max="500"
                      value={porcentajeAjuste}
                      onChange={(e) => setPorcentajeAjuste(Math.abs(Number(e.target.value)))}
                      className="w-full px-4 py-2.5 text-lg font-black rounded-xl border border-gray-300 outline-none focus:border-[#1B87C8]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                      %
                    </span>
                  </div>
                </div>

                {/* Chips rápidos de porcentaje */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {[5, 10, 15, 20, 25, 30, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPorcentajeAjuste(val)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                        porcentajeAjuste === val
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {tipoAjuste === "aumentar" ? `+${val}%` : `-${val}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opción de Redondeo */}
              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={redondearEnteros}
                    onChange={(e) => setRedondearEnteros(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1B87C8] focus:ring-[#1B87C8]"
                  />
                  <span>Redondear precios a números enteros (sin centavos)</span>
                </label>
              </div>

              {/* 4. Vista previa en tiempo real */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-500 mb-2">
                  <span>Vista previa de impacto</span>
                  <span className="text-[#1B87C8]">
                    {productosObjetivoPrecios.length} productos afectados
                  </span>
                </div>

                {productosObjetivoPrecios.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">
                    No hay productos dentro del alcance seleccionado.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {productosObjetivoPrecios.slice(0, 4).map((p) => {
                      const nuevo = calcularNuevoPrecio(p.precio);
                      const dif = nuevo - p.precio;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-gray-100"
                        >
                          <span className="truncate max-w-[200px] font-medium text-gray-800">
                            {p.nombre}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 line-through">
                              ${p.precio.toLocaleString("es-AR")}
                            </span>
                            <span className="font-bold text-gray-900">
                              ➔ ${nuevo.toLocaleString("es-AR")}
                            </span>
                            <span
                              className={`font-semibold ${
                                dif >= 0 ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              ({dif >= 0 ? "+" : ""}${dif.toLocaleString("es-AR")})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalPreciosOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={aplicarModificacionPrecios}
                  disabled={aplicandoPrecios || productosObjetivoPrecios.length === 0}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "#1B87C8" }}
                >
                  {aplicandoPrecios
                    ? "Aplicando cambios..."
                    : `Aplicar a ${productosObjetivoPrecios.length} productos`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: CONFIRMACIÓN DE ELIMINACIÓN MASIVA                    */}
      {/* ============================================================= */}
      {modalEliminarMasivoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-red-200">
            <div className="text-center">
              <span className="text-4xl mb-2 inline-block">⚠️</span>
              <h3
                className="font-black uppercase text-2xl text-red-600"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Eliminar {seleccionados.length} Productos
              </h3>
              <p className="text-xs text-gray-600 mt-2 mb-4">
                Estás a punto de eliminar de forma permanente{" "}
                <strong>{seleccionados.length} productos</strong> de la base de datos. Esta acción no se
                puede deshacer.
              </p>

              {/* Lista pequeña de resumen */}
              <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 max-h-36 overflow-y-auto text-left text-xs space-y-1 mb-5">
                {productos
                  .filter((p) => seleccionados.includes(p.id))
                  .slice(0, 5)
                  .map((p) => (
                    <div key={p.id} className="text-gray-800 truncate">
                      • {p.nombre} ({p.sku})
                    </div>
                  ))}
                {seleccionados.length > 5 && (
                  <div className="text-gray-500 font-semibold pt-1">
                    ... y {seleccionados.length - 5} productos más
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalEliminarMasivoOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarEliminacionMasiva}
                  disabled={eliminandoMasivo}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-all shadow-md disabled:opacity-50"
                >
                  {eliminandoMasivo ? "Eliminando..." : "Sí, eliminar definitivamente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: GESTIÓN Y CREACIÓN DE CATEGORÍAS                     */}
      {/* ============================================================= */}
      {modalCategoriasOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
            >
              <div>
                <h3
                  className="font-black uppercase text-xl text-gray-900"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  🏷️ Gestión de Categorías
                </h3>
                <p className="text-xs text-gray-500">
                  Las categorías creadas impactan en la carga masiva y en el catálogo
                </p>
              </div>
              <button
                onClick={() => setModalCategoriasOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Formulario para Crear Nueva Categoría */}
              <div className="p-4 rounded-xl bg-[#F0F7FD] border border-[#D6EAF8]">
                <h4 className="font-bold text-sm text-[#1B87C8] mb-3">
                  + Crear Nueva Categoría
                </h4>

                {errorCategoria && (
                  <div className="p-2 mb-3 rounded text-xs bg-red-100 text-red-700 font-semibold">
                    {errorCategoria}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Nombre de la categoría *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Pinturas, Fijaciones, Sanitarios..."
                      value={nuevoNombreCategoria}
                      onChange={(e) => setNuevoNombreCategoria(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white outline-none focus:border-[#1B87C8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Emoji identificador
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJIS_CATEGORIAS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setNuevoEmojiCategoria(em)}
                          className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                            nuevoEmojiCategoria === em
                              ? "bg-white border-2 border-[#1B87C8] shadow-xs scale-105"
                              : "bg-white/80 border border-gray-200 hover:bg-white"
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCrearCategoria}
                    disabled={guardandoCategoria || !nuevoNombreCategoria.trim()}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-xs hover:brightness-105 disabled:opacity-50"
                    style={{ background: "#1B87C8" }}
                  >
                    {guardandoCategoria ? "Guardando categoría..." : "Crear Categoría"}
                  </button>
                </div>
              </div>

              {/* Lista de Categorías Existentes */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-gray-600 mb-2">
                  Categorías registradas ({categorias.length})
                </h4>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  {categorias.map((cat) => {
                    const cantProductos = productos.filter((p) => p.categoria_id === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        className="px-4 py-2.5 flex items-center justify-between bg-white hover:bg-gray-50 text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{cat.emoji || "📦"}</span>
                          <div>
                            <span className="font-semibold text-gray-800">{cat.nombre}</span>
                            <span className="text-xs text-gray-400 ml-2 font-mono">
                              ID: {cat.id}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            {cantProductos} prod.
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEliminarCategoria(cat)}
                            className="text-xs text-red-500 hover:text-red-700 hover:underline"
                            title="Eliminar categoría si no tiene productos"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: CREACIÓN Y EDICIÓN INDIVIDUAL DE PRODUCTO            */}
      {/* ============================================================= */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
            >
              <h3
                className="font-black uppercase text-xl"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {editando ? "Editar producto" : "Nuevo producto"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ color: "#aaa", fontSize: "20px" }}
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {/* Imagen del producto */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">
                  Imagen del producto
                </label>

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
                      onChange={(e) => setArchivoImagen(e.target.files?.[0] || null)}
                      className="text-sm"
                    />
                    {subiendoImagen && (
                      <p className="text-xs mt-1" style={{ color: "#1B87C8" }}>
                        Subiendo imagen...
                      </p>
                    )}
                    {!form.imagen_url && !archivoImagen && (
                      <p className="text-xs mt-1" style={{ color: "#aaa" }}>
                        Sin imagen todavía — se usará el ícono como respaldo.
                      </p>
                    )}
                  </div>
                </div>

                {/* Selector de icono de respaldo */}
                <label className="block text-xs font-bold uppercase tracking-wide mb-2 mt-3">
                  Icono de respaldo
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICONOS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, icono: ic }))}
                      className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all"
                      style={{
                        border:
                          form.icono === ic ? "2px solid #1B87C8" : "1.5px solid rgba(0,0,0,0.1)",
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
                  <input
                    style={inputStyle}
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Nombre del producto"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Marca</label>
                  <input
                    style={inputStyle}
                    value={form.marca}
                    onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                    placeholder="Marca"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">SKU</label>
                  <input
                    style={inputStyle}
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    placeholder="SKU-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Categoría</label>
                  <select
                    style={inputStyle}
                    value={form.categoria_id}
                    onChange={(e) => setForm((f) => ({ ...f, categoria_id: Number(e.target.value) }))}
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji || "📦"} {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Precio</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={form.precio}
                    onChange={(e) => setForm((f) => ({ ...f, precio: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Stock</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Badge</label>
                  <select
                    style={inputStyle}
                    value={form.badge || ""}
                    onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  >
                    <option value="">Sin badge</option>
                    <option value="Oferta">Oferta</option>
                    <option value="Nuevo">Nuevo</option>
                    <option value="Destacado">Destacado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Estado</label>
                  <select
                    style={inputStyle}
                    value={form.activo ? "true" : "false"}
                    onChange={(e) => setForm((f) => ({ ...f, activo: e.target.value === "true" }))}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-lg font-bold text-sm"
                  style={{ border: "1.5px solid rgba(0,0,0,0.1)", color: "#555" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
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
