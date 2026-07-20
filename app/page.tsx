"use client";
import { useEffect, useState } from "react";
import { useCart } from "./context/CartContext";
import { supabase } from "./lib/supabase";
import Link from "next/link";

interface Producto {
  id: string;
  nombre: string;
  marca: string;
  sku: string;
  precio: number;
  icono: string;
  imagen_url: string | null;
  badge: string | null;
  stock: number;
}

export default function Home() {
  const { addItem } = useCart();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState("all");
  const [descuento, setDescuento] = useState(30);

  useEffect(() => {
    async function fetchProductos() {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("activo", true)
        .order("id", { ascending: true });
      if (!error) setProductos(data || []);
      setLoading(false);
    }
    fetchProductos();
  }, []);

  useEffect(() => {
  async function fetchDescuento() {
    const { data } = await supabase
      .from("configuracion")
      .select("descuento_porcentaje")
      .eq("id", 1)
      .single();
    if (data) setDescuento(data.descuento_porcentaje);
  }
  fetchDescuento();
}, []);

  return (
    <main>
      {/* HERO CON IMAGEN REAL */}
      <section
        className="relative text-white"
        style={{
          background: `linear-gradient(rgba(0,0,0,0.62), rgba(0,0,0,0.62)), url('/Foto02.png') center/cover no-repeat`,
          minHeight: "560px",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-28">
          <div
            className="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1 rounded-full mb-5 border"
            style={{ color: "#F5A623", borderColor: "rgba(245,166,35,0.4)", background: "rgba(245,166,35,0.1)" }}
          >
            ✦ Desde 1967 en el sector
          </div>
          <h1
            className="font-black uppercase leading-none mb-5 text-4xl sm:text-6xl md:text-7xl lg:text-8xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-1px" }}
          >
            TODO PARA<br />TU <span style={{ color: "#F5A623" }}>OBRA Y HOGAR</span>
          </h1>
          <p className="text-white/70 text-lg mb-8 max-w-lg">
            Herramientas, materiales y soluciones profesionales para construcción, industria y mantenimiento. Más de 15.000 productos disponibles.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/productos"
              className="font-semibold px-7 py-3 rounded bg-primary text-white hover:bg-primary-dark transition-all"
            >
              Ver catálogo →
            </Link>
            <Link
              href="/empresas"
              className="font-semibold px-7 py-3 rounded border border-white/40 hover:border-white text-white transition-all"
            >
              Cuenta empresas
            </Link>
          </div>

          <div className="flex gap-6 sm:gap-10 mt-12 flex-wrap">
            {[
              { num: "15K+", label: "Productos" },
              { num: "200+", label: "Marcas" },
              { num: "57+", label: "Años" },
            ].map((s) => (
              <div key={s.label}>
                <div
                  className="font-black text-4xl"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#F5A623" }}
                >
                  {s.num}
                </div>
                <div className="text-white/60 text-xs uppercase tracking-wide mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="border-b py-3 px-6 overflow-x-auto" style={{ background: "#F0F7FD", borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-6xl mx-auto flex gap-2 whitespace-nowrap">
          {[
            { id: "all", label: "Todos" },
            { id: "herramientas", label: "🔨 Herramientas" },
            { id: "electricidad", label: "⚡ Electricidad" },
            { id: "plomeria", label: "🚿 Plomería" },
            { id: "pintura", label: "🎨 Pintura" },
            { id: "fijacion", label: "🪛 Fijación" },
            { id: "seguridad", label: "🦺 Seguridad" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaActiva(cat.id)}
              className={`font-semibold text-sm px-4 py-2 rounded-full border transition-all ${
                categoriaActiva === cat.id
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-mid border-black/10 hover:bg-light"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-black uppercase text-4xl">
                Productos <span className="text-primary">Destacados</span>
              </h2>
              <p className="text-sm mt-1 text-mid">
                Sincronizados en tiempo real con DUX ERP
              </p>
            </div>
            <Link href="/productos" className="text-sm font-semibold text-primary">
              Ver todos →
            </Link>
          </div>

          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-72 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {productos.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl overflow-hidden relative group"
                  style={{ border: "1.5px solid rgba(0,0,0,0.08)", transition: "all 0.2s" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#1B87C8";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(27,135,200,0.15)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  {p.badge && (
                    <span
                      className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded z-10"
                      style={
                        p.badge === "Oferta"
                          ? { background: "#16A34A", color: "white" }
                          : { background: "#F5A623", color: "#1A1A1A" }
                      }
                    >
                      {p.badge}
                    </span>
                  )}
                  <div className="h-44 flex items-center justify-center bg-light overflow-hidden">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">{p.icono}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1 text-primary">{p.marca}</div>
                    <div className="font-semibold text-sm leading-snug mb-1 text-[#1A1A1A]">{p.nombre}</div>
                    <div className="text-xs mb-3 text-gray-400">SKU: {p.sku}</div>
                    <div className="font-black text-xl mb-3">
                      ${p.precio.toLocaleString("es-AR")}
                    </div>
                    <button
                      onClick={() => addItem({ id: p.sku, name: p.nombre, price: p.precio, brand: p.marca, icon: p.icono })}
                      className="w-full text-white text-sm font-semibold py-2 rounded bg-primary hover:bg-primary-dark transition-all"
                    >
                      🛒 Agregar al carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div
            className="rounded-xl p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between overflow-hidden relative gap-6"
            style={{ background: "#1A1A1A" }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{ background: "linear-gradient(135deg, #1B87C8 0%, transparent 60%)" }}
            ></div>
            <div className="relative z-10">
              <div className="text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded inline-block bg-accent/15 text-accent">
                OFERTA ESPECIAL
              </div>
              <h2
                className="font-black uppercase text-white leading-none mb-3 text-3xl sm:text-5xl md:text-6xl"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                HASTA <span className="text-accent">{descuento}%</span><br />DE DESCUENTO
              </h2>
              <p className="text-white/60 text-sm mb-5">
                En herramientas eléctricas seleccionadas. Válido hasta agotar stock.
              </p>
              <Link
                href="/productos"
                className="inline-block font-semibold px-6 py-3 rounded bg-primary hover:bg-primary-dark text-white transition-all"
              >
                Ver ofertas →
              </Link>
            </div>
            <div className="relative z-10 text-9xl hidden md:block">🪛</div>
          </div>
        </div>
      </section>

      {/* MARCAS */}
      <section className="py-16 px-6 bg-light">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black uppercase text-4xl mb-8">
            Marcas <span className="text-primary">Líderes</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            {["STANLEY", "DEWALT", "BOSCH", "MAKITA", "3M", "PHILIPS", "NORTON", "WURTH", "SIEMENS", "PRYSMIAN"].map((marca) => (
              <div
                key={marca}
                className="font-black text-sm px-5 py-3 rounded border cursor-pointer transition-all"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  background: "white",
                  borderColor: "rgba(0,0,0,0.1)",
                  color: "#555",
                  letterSpacing: "1px",
                }}
              >
                {marca}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}