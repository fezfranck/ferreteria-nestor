"use client";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";

interface Producto {
  id: string;
  nombre: string;
  marca: string;
  sku: string;
  precio: number;
  icono: string;
  badge: string | null;
  stock: number;
  categoria_id: number;
}

const CATEGORIAS = [
  { id: 0, nombre: "Todos", emoji: "🔍" },
  { id: 1, nombre: "Electricidad", emoji: "⚡" },
  { id: 2, nombre: "Herramientas", emoji: "🔨" },
  { id: 3, nombre: "Iluminación", emoji: "💡" },
  { id: 4, nombre: "Cables", emoji: "🔌" },
  { id: 5, nombre: "Tableros", emoji: "📋" },
  { id: 6, nombre: "Seguridad", emoji: "🦺" },
];

const ORDENAMIENTO = [
  { value: "default", label: "Más vendidos" },
  { value: "precio_asc", label: "Precio: Menor a Mayor" },
  { value: "precio_desc", label: "Precio: Mayor a Menor" },
  { value: "nombre_asc", label: "Nombre A–Z" },
];

export default function Productos() {
  const { addItem } = useCart();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("default");

  useEffect(() => {
    async function fetchProductos() {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("activo", true);

      if (error) {
        console.error("Error:", error);
      } else {
        setProductos(data || []);
      }
      setLoading(false);
    }
    fetchProductos();
  }, []);

  // Filtrar y ordenar
  const productosFiltrados = productos
    .filter((p) => {
      const coincideCategoria = categoriaActiva === 0 || p.categoria_id === categoriaActiva;
      const coincideBusqueda =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.sku.toLowerCase().includes(busqueda.toLowerCase());
      return coincideCategoria && coincideBusqueda;
    })
    .sort((a, b) => {
      if (orden === "precio_asc") return a.precio - b.precio;
      if (orden === "precio_desc") return b.precio - a.precio;
      if (orden === "nombre_asc") return a.nombre.localeCompare(b.nombre);
      return 0;
    });

  return (
    <main>
      {/* HERO */}
      <section className="bg-[#1A1A1A] text-white py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-sm text-white/50 mb-3">
            Inicio › <span className="text-white font-semibold">Productos</span>
          </div>
          <h1 className="font-bold text-5xl tracking-tight mb-3">
            Catálogo de <span className="text-[#1B87C8]">Productos</span>
          </h1>
          <p className="text-white/60 text-base">
            15.000+ productos · Precios con IVA incluido · Stock permanente
          </p>
        </div>
      </section>

      {/* BARRA DE BÚSQUEDA Y ORDEN */}
      <section className="bg-white border-b border-black/8 py-4 px-6 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto flex gap-4 items-center flex-wrap">
          {/* Buscador */}
          <div className="flex-1 min-w-52 flex bg-[#F0F7FD] border border-[#D6EAF8] rounded-full overflow-hidden focus-within:border-[#1B87C8] transition-colors">
            <input
              type="text"
              placeholder="Buscar por nombre, marca o SKU..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-transparent flex-1 px-5 py-2 text-sm outline-none"
            />
            <span className="bg-[#1B87C8] text-white px-5 flex items-center text-sm">
              🔍
            </span>
          </div>

          {/* Ordenamiento */}
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="border border-black/10 rounded-full px-4 py-2 text-sm outline-none focus:border-[#1B87C8] bg-white transition-colors"
          >
            {ORDENAMIENTO.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Contador */}
          <span className="text-sm text-[#555] flex-shrink-0">
            <strong>{productosFiltrados.length}</strong> productos
          </span>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="bg-[#F0F7FD] border-b border-black/8 py-3 px-6 overflow-x-auto">
        <div className="max-w-6xl mx-auto flex gap-2 whitespace-nowrap">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaActiva(cat.id)}
              className={`font-medium text-sm px-4 py-2 rounded-full transition-all border ${
                categoriaActiva === cat.id
                  ? "bg-[#1B87C8] text-white border-[#1B87C8]"
                  : "bg-white border-black/10 text-[#555] hover:bg-[#1B87C8] hover:text-white hover:border-[#1B87C8]"
              }`}
            >
              {cat.emoji} {cat.nombre}
            </button>
          ))}
        </div>
      </section>

      {/* GRILLA DE PRODUCTOS */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">

          {/* LOADING */}
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-72 animate-pulse" />
              ))}
            </div>
          )}

          {/* SIN RESULTADOS */}
          {!loading && productosFiltrados.length === 0 && (
            <div className="text-center py-24 text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <p className="font-semibold text-lg">No encontramos productos</p>
              <p className="text-sm mt-2">Probá con otro término o categoría</p>
              <button
                onClick={() => { setBusqueda(""); setCategoriaActiva(0); }}
                className="mt-6 bg-[#1B87C8] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#1569A0] transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* PRODUCTOS */}
          {!loading && productosFiltrados.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {productosFiltrados.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-black/8 rounded-xl overflow-hidden hover:border-[#1B87C8] hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer relative"
                >
                  {p.badge && (
                    <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full z-10 ${
                      p.badge === "Oferta" ? "bg-green-600 text-white" : "bg-yellow-400 text-black"
                    }`}>
                      {p.badge}
                    </span>
                  )}
                  <div className="h-44 bg-[#F0F7FD] flex items-center justify-center text-6xl">
                    {p.icono}
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-semibold text-[#1B87C8] uppercase tracking-wide mb-1">{p.marca}</div>
                    <div className="font-semibold text-[#1A1A1A] mb-1 text-sm leading-snug">{p.nombre}</div>
                    <div className="text-xs text-gray-400 mb-3">SKU: {p.sku}</div>
                    <div className="text-xl font-bold mb-3">${p.precio.toLocaleString("es-AR")}</div>
                    <button
                      onClick={() => addItem({
                        id: p.sku,
                        name: p.nombre,
                        price: p.precio,
                        brand: p.marca,
                        icon: p.icono,
                      })}
                      className="w-full bg-[#1B87C8] hover:bg-[#1569A0] text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                    >
                      🛒 Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}