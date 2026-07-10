"use client";
import { useState } from "react";

export default function Contacto() {
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviado(true);
    setTimeout(() => setEnviado(false), 4000);
  }

  return (
    <main>
      {/* HERO CON IMAGEN */}
      <section
        className="relative text-white"
        style={{
          background: `linear-gradient(rgba(0,0,0,0.62), rgba(0,0,0,0.62)), url('/Foto06.png') center/cover no-repeat`,
          minHeight: "300px",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
            Inicio › <span className="font-semibold text-white">Contacto</span>
          </div>
          <h1
            className="font-black uppercase leading-none mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "72px" }}
          >
            Hablemos
          </h1>
          <p className="text-lg" style={{ color: "rgba(255,255,255,0.65)" }}>
            Estamos para ayudarte. Respondemos en menos de 2 horas en horario comercial.
          </p>
        </div>
      </section>

      {/* CONTENIDO */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">

          {/* INFO */}
          <div>
            <h2
              className="font-black uppercase text-5xl leading-none mb-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Como podemos <span style={{ color: "#1B87C8" }}>ayudarte?</span>
            </h2>
            <p className="leading-relaxed mb-8" style={{ color: "#555" }}>
              Consultanos por presupuestos, disponibilidad de productos, condiciones para empresas o cualquier duda tecnica. Nuestro equipo esta listo.
            </p>

            <div className="flex flex-col gap-6">
              {[
                { icon: "📍", title: "Direccion", lines: ["Ignacio Crespo 1136, Recreo - Santa Fe", "Argentina"] },
                { icon: "📞", title: "Telefonos", lines: ["(0342) 5128458", "(0342) 5128458 WhatsApp"] },
                { icon: "📧", title: "Email", lines: ["electricidadnestorrecreo@gmail.com"] },
                { icon: "🕐", title: "Horario", lines: ["Lunes a Viernes 8:00-18:00", "Sabados 8:00-13:00"] },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "#F0F7FD", border: "1px solid #D6EAF8" }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4
                      className="font-black uppercase text-sm mb-1"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {item.title}
                    </h4>
                    {item.lines.map((l) => (
                      <p key={l} className="text-sm" style={{ color: "#555" }}>{l}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <a
              href="https://wa.me/5403425128458"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 font-semibold px-6 py-3 rounded mt-8 transition-all"
              style={{ background: "#25D366", color: "white" }}
              >
              Escribinos por WhatsApp
            </a>
          </div>

          {/* FORMULARIO */}
          <div
            className="bg-white rounded-xl p-8"
            style={{ border: "1.5px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}
          >
            <h3
              className="font-black uppercase text-2xl mb-6"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Envianos un mensaje
            </h3>

            {enviado && (
              <div
                className="rounded-xl px-5 py-4 mb-6 text-sm font-medium"
                style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", color: "#16A34A" }}
              >
                Mensaje enviado! Te respondemos en menos de 2 horas.
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Nombre</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    required
                    className="w-full px-4 py-3 text-sm outline-none rounded-lg transition-colors"
                    style={{ border: "1.5px solid rgba(0,0,0,0.1)" }}
                    onFocus={e => (e.target.style.borderColor = "#1B87C8")}
                    onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2">Apellido</label>
                  <input
                    type="text"
                    placeholder="Tu apellido"
                    required
                    className="w-full px-4 py-3 text-sm outline-none rounded-lg transition-colors"
                    style={{ border: "1.5px solid rgba(0,0,0,0.1)" }}
                    onFocus={e => (e.target.style.borderColor = "#1B87C8")}
                    onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Email</label>
                <input
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  required
                  className="w-full px-4 py-3 text-sm outline-none rounded-lg transition-colors"
                  style={{ border: "1.5px solid rgba(0,0,0,0.1)" }}
                  onFocus={e => (e.target.style.borderColor = "#1B87C8")}
                  onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Telefono</label>
                <input
                  type="tel"
                  placeholder="+54 342 ..."
                  className="w-full px-4 py-3 text-sm outline-none rounded-lg transition-colors"
                  style={{ border: "1.5px solid rgba(0,0,0,0.1)" }}
                  onFocus={e => (e.target.style.borderColor = "#1B87C8")}
                  onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Tipo de consulta</label>
                <select
                  className="w-full px-4 py-3 text-sm outline-none rounded-lg bg-white transition-colors"
                  style={{ border: "1.5px solid rgba(0,0,0,0.1)" }}
                  onFocus={e => (e.target.style.borderColor = "#1B87C8")}
                  onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                >
                  <option>Consulta general</option>
                  <option>Presupuesto</option>
                  <option>Cuenta empresarial</option>
                  <option>Soporte tecnico</option>
                  <option>Proveedor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Mensaje</label>
                <textarea
                  placeholder="Contanos en que podemos ayudarte..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 text-sm outline-none rounded-lg resize-none transition-colors"
                  style={{ border: "1.5px solid rgba(0,0,0,0.1)" }}
                  onFocus={e => (e.target.style.borderColor = "#1B87C8")}
                  onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                />
              </div>

              <button
                type="submit"
                className="w-full font-bold py-4 rounded text-base transition-all"
                style={{ background: "#1B87C8", color: "white", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}
              >
                Enviar mensaje
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}