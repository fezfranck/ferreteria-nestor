"use client";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: Props) {
  const { items, addItem, removeItem, decrementItem, total, count, clearCart } = useCart();
  const { user } = useAuth();

  // Estados de checkout
  const [comprando, setComprando] = useState(false);
  const [checkoutExitoso, setCheckoutExitoso] = useState(false);
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  
  // Formulario para invitado
  const [mostrarFormInvitado, setMostrarFormInvitado] = useState(false);
  const [invitadoNombre, setInvitadoNombre] = useState("");
  const [invitadoEmail, setInvitadoEmail] = useState("");
  const [invitadoTelefono, setInvitadoTelefono] = useState("");
  const [errorForm, setErrorForm] = useState("");

  async function procesarCompra(nombre: string, email: string, telefono: string) {
    console.log("Procesando pedido para:", nombre, email, telefono);
    setComprando(true);
    setErrorForm("");

    try {
      // Registrar en Supabase
      const { data, error } = await supabase
        .from("pedidos")
        .insert([
          {
            cliente_nombre: nombre,
            cliente_email: email,
            total: total,
            items: items.map(item => ({
              id: item.id,
              name: item.name,
              brand: item.brand,
              price: item.price,
              quantity: item.quantity,
              icon: item.icon
            })),
            estado: "Pendiente",
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        console.error("Error creating order:", error);
        setErrorForm("No pudimos registrar tu compra. Intentalo de nuevo.");
      } else {
        // Exito
        const nuevoId = data && data[0] ? data[0].id : Math.floor(1000 + Math.random() * 9000);
        setPedidoId(nuevoId);
        setCheckoutExitoso(true);
        clearCart();
      }
    } catch (err) {
      console.error("Connection error:", err);
      setErrorForm("Error de conexión al procesar la compra.");
    } finally {
      setComprando(false);
    }
  }

  function handleFinalizarClick() {
    if (user) {
      // Si está logueado, compramos inmediatamente con sus datos
      procesarCompra(user.nombre, user.email, "");
    } else {
      // Si no, mostramos el formulario de datos para invitado
      setMostrarFormInvitado(true);
    }
  }

  function handleFormInvitadoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invitadoNombre.trim() || !invitadoEmail.trim()) {
      setErrorForm("Por favor completa los campos requeridos.");
      return;
    }
    procesarCompra(invitadoNombre, invitadoEmail, invitadoTelefono);
  }

  function resetState() {
    setCheckoutExitoso(false);
    setPedidoId(null);
    setMostrarFormInvitado(false);
    setInvitadoNombre("");
    setInvitadoEmail("");
    setInvitadoTelefono("");
    setErrorForm("");
    onClose();
  }

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    fontSize: "13px",
    borderRadius: "8px",
    border: "1.5px solid rgba(0,0,0,0.12)",
    outline: "none",
    background: "#fafafa",
    color: "#1A1A1A"
  };

  return (
    <>
      {/* FONDO OSCURO */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={resetState}
        />
      )}

      {/* PANEL LATERAL */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">Mi carrito</h2>
            <p className="text-sm text-gray-400">{count} {count === 1 ? "producto" : "productos"}</p>
          </div>
          <button
            onClick={resetState}
            className="text-gray-400 hover:text-black text-2xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
          
          {checkoutExitoso ? (
            /* COMPRA EXITOSA */
            <div className="flex flex-col items-center justify-center text-center gap-4 py-10 my-auto animate-fade-in">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-5xl border border-green-200">
                🎉
              </div>
              <h3 className="font-black text-3xl uppercase text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                ¡Compra Exitosa!
              </h3>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                Registramos tu pedido <span className="font-bold text-[#1B87C8]">#{pedidoId}</span> correctamente. En breve nos pondremos en contacto contigo para coordinar el pago y el envío.
              </p>
              <div className="bg-[#F0F7FD] border border-[#D6EAF8] rounded-xl p-4 text-xs text-[#1B87C8] font-semibold mt-2">
                ¡Gracias por confiar en Electricidad Néstor!
              </div>
              <button
                onClick={resetState}
                className="mt-6 bg-[#1B87C8] hover:bg-[#1569A0] text-white text-sm font-semibold px-8 py-3 rounded-full transition-colors w-full"
              >
                Cerrar y seguir comprando
              </button>
            </div>
          ) : items.length === 0 ? (
            /* CARRITO VACÍO */
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 my-auto">
              <div className="text-6xl">🛒</div>
              <p className="font-semibold text-gray-600">Tu carrito está vacío</p>
              <p className="text-sm text-gray-400">Agregá productos para empezar</p>
              <button
                onClick={onClose}
                className="mt-4 bg-[#1B87C8] text-white text-sm font-semibold px-6 py-2 rounded-full hover:bg-[#1569A0] transition-colors"
              >
                Ver productos
              </button>
            </div>
          ) : mostrarFormInvitado ? (
            /* FORMULARIO DE INVITADO */
            <div className="flex flex-col gap-5 py-4 animate-fade-in">
              <div>
                <h3 className="font-bold text-base text-gray-900">Completa tus datos</h3>
                <p className="text-xs text-gray-500">Necesitamos estos datos para registrar tu pedido de compra.</p>
              </div>

              {errorForm && (
                <div className="bg-red-50 text-red-600 border border-red-100 text-xs px-3 py-2.5 rounded-lg">
                  ❌ {errorForm}
                </div>
              )}

              <form onSubmit={handleFormInvitadoSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    style={inputStyle}
                    value={invitadoNombre}
                    onChange={e => setInvitadoNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    style={inputStyle}
                    value={invitadoEmail}
                    onChange={e => setInvitadoEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Teléfono (WhatsApp)</label>
                  <input
                    type="tel"
                    style={inputStyle}
                    value={invitadoTelefono}
                    onChange={e => setInvitadoTelefono(e.target.value)}
                    placeholder="Ej. +54 342 5128458"
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarFormInvitado(false)}
                    className="flex-1 py-3 border border-black/10 hover:border-black/25 text-gray-600 rounded-full text-xs font-semibold transition-all"
                  >
                    Volver al carrito
                  </button>
                  <button
                    type="submit"
                    disabled={comprando}
                    className="flex-1 py-3 bg-[#1B87C8] hover:bg-[#1569A0] disabled:bg-gray-400 text-white rounded-full text-xs font-semibold transition-all"
                  >
                    {comprando ? "Procesando..." : "Confirmar compra"}
                  </button>
                </div>
              </form>

              <div className="text-center text-xs text-gray-400 mt-4 border-t pt-4">
                ¿Ya tienes una cuenta? <br />
                Cierra este panel e inicia sesión haciendo clic en <strong className="text-gray-600">&quot;Mi Cuenta&quot;</strong> en la barra superior.
              </div>
            </div>
          ) : (
            /* LISTADO DE ITEMS DEL CARRITO */
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 bg-[#F0F7FD] rounded-xl p-3 border border-[#F0F7FD] hover:border-[#1B87C8]/20 transition-all">
                  <div className="text-4xl w-14 h-14 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.icon || "🔌"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-[#1B87C8] uppercase tracking-wide">{item.brand}</div>
                    <div className="font-semibold text-sm truncate text-gray-900">{item.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">SKU: {item.id}</div>
                    <div className="font-bold text-gray-800 mt-0.5 text-xs">
                      ${(item.price * item.quantity).toLocaleString("es-AR")}
                    </div>
                  </div>
                  {/* Controles de cantidad responsivos e interactivos */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="flex items-center bg-white border border-black/10 rounded-full overflow-hidden shadow-sm">
                      <button
                        onClick={() => decrementItem(item.id)}
                        className="px-2 py-1 text-xs font-black text-gray-500 hover:bg-[#F0F7FD] hover:text-[#1B87C8] transition-colors"
                        type="button"
                      >
                        -
                      </button>
                      <span className="px-1 text-xs font-bold text-gray-800 min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addItem({ id: item.id, name: item.name, price: item.price, brand: item.brand, icon: item.icon })}
                        className="px-2 py-1 text-xs font-black text-gray-500 hover:bg-[#F0F7FD] hover:text-[#1B87C8] transition-colors"
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 text-xs transition-colors p-1 flex items-center gap-1"
                      title="Eliminar producto"
                      type="button"
                    >
                      <span>Eliminar</span> 🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER CON TOTAL (No visible si se completó el checkout o el carrito está vacío) */}
        {!checkoutExitoso && items.length > 0 && (
          <div className="px-6 py-5 border-t border-black/8 bg-white flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 font-medium">Total</span>
              <span className="text-2xl font-bold text-gray-900">${total.toLocaleString("es-AR")}</span>
            </div>

            {!mostrarFormInvitado ? (
              <button 
                onClick={handleFinalizarClick}
                disabled={comprando}
                className="w-full bg-[#1B87C8] hover:bg-[#1569A0] text-white font-semibold py-3 rounded-full transition-colors mb-2 text-sm"
              >
                {comprando ? "Procesando pedido..." : "Finalizar compra"}
              </button>
            ) : null}

            {!mostrarFormInvitado ? (
              <button
                onClick={resetState}
                className="w-full border border-black/10 hover:border-[#1B87C8] text-gray-500 hover:text-[#1B87C8] font-medium py-3 rounded-full transition-colors text-xs"
              >
                Seguir comprando
              </button>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}