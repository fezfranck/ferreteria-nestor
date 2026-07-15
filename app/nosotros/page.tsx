import Link from "next/link";
import Image from "next/image";

// Revalida esta página una vez por día para que el cálculo de años
// se actualice solo, sin necesidad de un nuevo deploy.
export const revalidate = 86400;

export default function Nosotros() {
  const foundingYear = 1967;
  const currentYear = new Date().getFullYear();
  const yearsInBusiness = currentYear - foundingYear;

  return (
    <main>
      {/* HERO CON IMAGEN REAL */}
      <section
        className="relative text-white"
        style={{
          background: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/Foto04.jpg') center/cover no-repeat`,
          minHeight: "400px",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <div
            className="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1 rounded-full mb-5 border"
            style={{ color: "#F5A623", borderColor: "rgba(245,166,35,0.4)", background: "rgba(245,166,35,0.1)" }}
          >
            Nuestra historia
          </div>
          <h1
            className="font-black uppercase leading-none mb-5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "72px" }}
          >
            {yearsInBusiness} años siendo <br />la ferretería de <span style={{ color: "#F5A623" }}>confianza</span>
          </h1>
          <p className="text-white/65 text-lg max-w-xl mx-auto">
            Desde 1967, Electricidad Nestor es el referente eléctrico de Recreo, Santa Fe y la región.
          </p>
        </div>
      </section>

      {/* HISTORIA */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div>
            <h2
              className="font-black uppercase text-5xl leading-none mb-6"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Una empresa <span style={{ color: "#1B87C8" }}>familiar</span> con historia
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: "#555" }}>
              Electricidad Nestor nació en 1967 de la mano de <strong>Alejandro Piascik</strong> y su esposa <strong>Dominga de Piascik</strong>, quienes con esfuerzo y dedicación construyeron el negocio eléctrico de referencia en Recreo, Santa Fe.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: "#555" }}>
              Lo que comenzó con la factura número 00001 el 11 de septiembre de 1967 —por un engranaje de ventilador Winfield a $50 pesos— se convirtió en una ferretería con más de 15.000 artículos y décadas de confianza de toda la comunidad recreína.
            </p>
            <p className="leading-relaxed mb-8" style={{ color: "#555" }}>
              Nuestra misión es simple: que el vecino y el profesional encuentren lo que necesitan, con el asesoramiento honesto que nos caracteriza desde siempre.
            </p>
            <Link
              href="/contacto"
              className="inline-block font-semibold px-7 py-3 rounded transition-all"
              style={{ background: "#1B87C8", color: "white" }}
            >
              Hablar con nosotros →
            </Link>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "⚡", title: "Especialistas en electricidad", desc: "Asesoramiento técnico en electricidad, herramientas y artículos para el hogar desde 1967." },
              { icon: "🤝", title: "Trato familiar", desc: `${yearsInBusiness} años de servicio honesto y personalizado a las familias de Recreo y la región.` },
              { icon: "🏠", title: "Raíces locales", desc: "Un negocio que nació y creció con la comunidad, en Ignacio Crespo 1136, Recreo." },
              { icon: "💡", title: "Stock y variedad", desc: "Las mejores marcas del mercado con el mayor stock disponible de la zona." },
            ].map((v) => (
              <div
                key={v.title}
                className="rounded-xl p-6"
                style={{ background: "#F0F7FD", borderLeft: "4px solid #1B87C8" }}
              >
                <div className="text-3xl mb-3">{v.icon}</div>
                <h4
                  className="font-bold text-sm mb-2 uppercase"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {v.title}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: "#555" }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HISTORIA EN IMÁGENES */}
      <section className="py-20 px-6" style={{ background: "#F0F7FD" }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="font-black uppercase text-4xl mb-2"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Historia en <span style={{ color: "#1B87C8" }}>imágenes</span>
          </h2>
          <p className="mb-10" style={{ color: "#555" }}>Los fundadores y los primeros años del negocio</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}>
              <Image
                src="/Foto04.jpg"
                alt="El local original de Electricidad Nestor"
                width={600}
                height={400}
                className="w-full h-64 object-cover"
              />
              <div className="p-5 bg-white">
                <div className="font-bold mb-1">El local original — Recreo, 1967</div>
                <div className="text-sm" style={{ color: "#555" }}>Ignacio Crespo 1136, donde todo comenzó.</div>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}>
              <Image
                src="/Foto05.JPG"
                alt="Alejandro y Dominga de Piascik"
                width={600}
                height={400}
                className="w-full h-64 object-cover"
              />
              <div className="p-5 bg-white">
                <div className="font-bold mb-1">Alejandro y Dominga de Piascik</div>
                <div className="text-sm" style={{ color: "#555" }}>Los fundadores que convirtieron un sueño en décadas de historia.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
          {[
            { num: `${yearsInBusiness}+`, label: "Años de historia", icon: "🏆" },
            { num: "15K+", label: "Artículos en stock", icon: "📦" },
            { num: "200+", label: "Marcas disponibles", icon: "🏭" },
            { num: "1967", label: "Año de fundación", icon: "📅" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-6" style={{ background: "#F0F7FD", border: "1px solid #D6EAF8" }}>
              <div className="text-4xl mb-2">{s.icon}</div>
              <div
                className="font-black text-3xl mb-1"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#1B87C8" }}
              >
                {s.num}
              </div>
              <div className="text-sm" style={{ color: "#555" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}