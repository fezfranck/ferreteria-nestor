"use client";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

export interface ModalProducto {
  id: string | number;
  nombre: string;
  marca: string;
  sku: string;
  precio: number;
  icono: string;
  imagen_url: string | null;
  badge?: string | null;
  stock: number;
  categoria_id?: number | null;
}

const NOMBRES_CATEGORIAS: Record<number, string> = {
  1: "Electricidad",
  2: "Herramientas",
  3: "Iluminación",
  4: "Cables",
  5: "Tableros",
  6: "Seguridad",
};

interface Props {
  producto: ModalProducto | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ producto, isOpen, onClose }: Props) {
  const { addItem } = useCart();
  const [cantidad, setCantidad] = useState(1);
  const [agregadoExitoso, setAgregadoExitoso] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCantidad(1);
      setAgregadoExitoso(false);
      // Evitar scroll en el fondo mientras el modal está abierto
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, producto]);

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !producto) return null;

  const enStock = producto.stock > 0;
  const maxCantidad = enStock ? Math.max(1, producto.stock) : 1;
  const categoriaNombre = producto.categoria_id
    ? NOMBRES_CATEGORIAS[producto.categoria_id] || "Ferretería y Electricidad"
    : "Ferretería y Electricidad";

  function handleAgregar() {
    if (!enStock || !producto) return;
    addItem(
      {
        id: producto.sku,
        name: producto.nombre,
        price: producto.precio,
        brand: producto.marca,
        icon: producto.icono,
      },
      cantidad
    );
    setAgregadoExitoso(true);
    setTimeout(() => {
      setAgregadoExitoso(false);
      onClose();
    }, 900);
  }

  function handleIncrementar() {
    if (cantidad < maxCantidad) {
      setCantidad((prev) => prev + 1);
    }
  }

  function handleDecrementar() {
    if (cantidad > 1) {
      setCantidad((prev) => prev - 1);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-producto-titulo"
    >
      <div
        className="bg-white w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl relative border border-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 flex-shrink-0 bg-[#FAFCFE]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1B87C8]">
              {categoriaNombre}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-400 font-mono">SKU: {producto.sku}</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-gray-200/60 flex items-center justify-center text-gray-400 hover:text-gray-700 text-xl font-bold transition-colors"
            aria-label="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* CUERPO CON SCROLL */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
          {/* FOTO O ICONO GRANDE */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="w-full h-64 sm:h-72 rounded-2xl bg-[#F0F7FD] border border-[#D6EAF8] flex items-center justify-center overflow-hidden relative group">
              {producto.badge && (
                <span
                  className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full z-10 shadow-xs"
                  style={
                    producto.badge === "Oferta"
                      ? { background: "#16A34A", color: "white" }
                      : { background: "#F5A623", color: "#1A1A1A" }
                  }
                >
                  {producto.badge}
                </span>
              )}

              {producto.imagen_url ? (
                <img
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <span className="text-8xl select-none">{producto.icono || "📦"}</span>
              )}
            </div>

            {/* Disponibilidad */}
            <div className="mt-4 flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 border border-black/5">
              <span className="text-xs font-semibold text-gray-500">Disponibilidad</span>
              {enStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  En stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100/70 px-3 py-1 rounded-full border border-red-200">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  Sin stock
                </span>
              )}
            </div>
          </div>

          {/* DETALLES Y ACCIÓN */}
          <div className="w-full md:w-1/2 flex flex-col justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#1B87C8] mb-1">
                {producto.marca}
              </div>
              <h2
                id="modal-producto-titulo"
                className="font-black text-2xl sm:text-3xl text-gray-900 leading-tight mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {producto.nombre}
              </h2>

              <div className="mb-4">
                <span className="text-xs text-gray-400 block mb-0.5">Precio unitario con IVA</span>
                <div className="text-3xl sm:text-4xl font-black text-gray-950" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  ${producto.precio.toLocaleString("es-AR")}
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3 mb-4 text-xs text-gray-500 space-y-1">
                <p>✓ Producto original garantizado por Electricidad Néstor.</p>
                <p>✓ Factura A y B disponible en mostrador y pedidos.</p>
                <p>✓ Retiro inmediato en sucursal o envío a coordinar.</p>
              </div>
            </div>

            {/* CONTROLES DE COMPRA */}
            <div className="border-t border-black/8 pt-4 flex flex-col gap-3">
              {enStock ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Cantidad
                    </span>
                    <div className="flex items-center border border-black/15 rounded-xl bg-gray-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={handleDecrementar}
                        disabled={cantidad <= 1}
                        className="w-10 h-10 flex items-center justify-center font-bold text-lg text-gray-600 hover:bg-gray-200/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Disminuir cantidad"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={maxCantidad}
                        value={cantidad}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setCantidad(Math.max(1, Math.min(val, maxCantidad)));
                          }
                        }}
                        className="w-12 text-center text-sm font-bold bg-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleIncrementar}
                        disabled={cantidad >= maxCantidad}
                        className="w-10 h-10 flex items-center justify-center font-bold text-lg text-gray-600 hover:bg-gray-200/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAgregar}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                      agregadoExitoso
                        ? "bg-emerald-600"
                        : "bg-[#1B87C8] hover:bg-[#1569A0] active:scale-[0.99]"
                    }`}
                  >
                    <span>{agregadoExitoso ? "✓" : "🛒"}</span>
                    <span>
                      {agregadoExitoso
                        ? `¡Agregado al carrito (${cantidad})!`
                        : `Agregar ${cantidad > 1 ? `(${cantidad}) ` : ""}al carrito`}
                    </span>
                  </button>
                </>
              ) : (
                <div className="text-center py-3 px-4 rounded-xl bg-gray-100 text-gray-500 text-xs font-semibold">
                  Este artículo no cuenta con unidades disponibles en este momento.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
