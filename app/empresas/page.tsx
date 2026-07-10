"use client";
import Link from "next/link";

export default function Empresas() {
  return (
    <main>
      {/* HERO CON IMAGEN */}
      <section
        className="relative text-white"
        style={{
          background: `linear-gradient(rgba(0,0,0,0.62), rgba(0,0,0,0.62)), url('/Foto06.png') center/cover no-repeat`,
          minHeight: "400px",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <div
            className="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1 rounded-full mb-5 border"
            style={{ color: "#F5A623", borderColor: "rgba(245,166,35,0.4)", background: "rgba(245,166,35,0.1)" }}
          >
            Para Empresas y Pymes
          </div>
          <h1
            className="font-black uppercase leading-none mb-5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "72px" }}
          >
            Soluciones <br /><span style={{ color: "#F5A623" }}>Empresariales</span>
          </h1>
          <p className="text-white/75 text-lg max-w-xl mx-auto mb-8">
            Condiciones especiales, cuenta corriente y atención personalizada para empresas de todos los rubros.
          </p>
          <Link
            href="/contacto"
            className="inline-block font-semibold px-8 py-4 rounded text-base transition-all"
            style={{ background: "#1B87C8", color: "white" }}
          >
            Solicitar cuenta empresarial →
          </Link>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="font-black uppercase text-5xl leading-none mb-2"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Beneficios <span style={{ color: "#1B87C8" }}>Exclusivos</span>
            </h2>
            <p style={{ color: "#555" }}>Diseñados para empresas que necesitan más</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "💳", title: "Cuenta Corriente", desc: "Gestión simplificada de pagos con plazos de 30, 60 y 90 días. Integrado con DUX para control automático de deuda." },
              { icon: "📊", title: "Precios Diferenciados", desc: "Listas de precios exclusivas según volumen de compra. Actualizadas en tiempo real desde nuestro sistema DUX ERP." },
              { icon: "🚚", title: "Envío Prioritario", desc: "Entrega en obra o depósito con seguimiento en tiempo real. Flota propia para la región." },
              { icon: "🤝", title: "Asesor Dedicado", desc: "Un asesor comercial asignado a tu cuenta para consultas técnicas, presupuestos y pedidos especiales." },
              { icon: "📋", title: "Pedidos por Licitación", desc: "Participamos en licitaciones privadas y públicas. Documentación completa: factura A, remito y certificados." },
              { icon: "🔗", title: "API de Integración", desc: "Conecta tu sistema ERP o software de compras directo a nuestro catálogo para pedidos automatizados." },
            ].map((b) => (
              <div
                key={b.title}
                className="bg-white rounded-xl p-7 transition-all"
                style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
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
                <div className="text-4xl mb-4">{b.icon}</div>
                <h3
                  className="font-black uppercase text-lg mb-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {b.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#555" }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RUBROS */}
      <section className="py-20 px-6" style={{ background: "#F0F7FD" }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="font-black uppercase text-5xl mb-10 text-center"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Rubros que <span style={{ color: "#1B87C8" }}>Atendemos</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: "🏗️", label: "Construcción" },
              { icon: "🏭", label: "Industria" },
              { icon: "🏢", label: "Facilities" },
              { icon: "⚡", label: "Electricidad" },
              { icon: "🔧", label: "Mantenimiento" },
              { icon: "🌿", label: "Agro" },
              { icon: "🏫", label: "Instituciones" },
              { icon: "🚗", label: "Automotriz" },
            ].map((r) => (
              <div
                key={r.label}
                className="bg-white rounded-xl p-6 text-center transition-all"
                style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
              >
                <div className="text-4xl mb-3">{r.icon}</div>
                <h4
                  className="font-bold uppercase text-sm"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {r.label}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 px-6 text-white text-center"
        style={{ background: "#1A1A1A" }}
      >
        <div className="max-w-2xl mx-auto">
          <h2
            className="font-black uppercase leading-none mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "56px" }}
          >
            ¿LISTO PARA <span style={{ color: "#F5A623" }}>EMPEZAR?</span>
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Abrí tu cuenta empresarial en menos de 24 horas hábiles
          </p>
          <Link
            href="/contacto"
            className="inline-block font-bold px-8 py-4 rounded text-base transition-all"
            style={{ background: "#1B87C8", color: "white" }}
          >
            Contactar un asesor →
          </Link>
        </div>
      </section>
    </main>
  );
}