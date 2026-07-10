import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ background: "#1A1A1A", color: "rgba(255,255,255,0.6)" }}>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">

        {/* Columna 1 - Logo y descripción */}
        <div>
          <div
            className="font-black uppercase text-2xl mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "white" }}
          >
            ELECTRICIDAD <span style={{ color: "#1B87C8" }}>NESTOR</span>
          </div>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
            57+ años siendo el proveedor de confianza para profesionales y empresas de toda la Argentina. Stock permanente, precios competitivos y atención especializada.
          </p>
          <div className="flex gap-3">
            {["f", "in", "ig"].map((s) => (
              <a
                key={s}
                href="#"
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        {/* Columna 2 - Páginas */}
        <div>
          <h4
            className="font-bold uppercase text-xs tracking-widest mb-4"
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            Páginas
          </h4>
          <div className="flex flex-col gap-2">
            {[
              { label: "Inicio", href: "/" },
              { label: "Catálogo", href: "/productos" },
              { label: "Empresas", href: "/empresas" },
              { label: "Nosotros", href: "/nosotros" },
              { label: "Contacto", href: "/contacto" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Columna 3 - Categorías */}
        <div>
          <h4
            className="font-bold uppercase text-xs tracking-widest mb-4"
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            Categorías
          </h4>
          <div className="flex flex-col gap-2">
            {["Herramientas", "Electricidad", "Plomería", "Pintura", "Fijación", "Seguridad"].map((cat) => (
              <Link
                key={cat}
                href="/productos"
                className="text-sm transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {/* Columna 4 - Info */}
        <div>
          <h4
            className="font-bold uppercase text-xs tracking-widest mb-4"
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            Info
          </h4>
          <div className="flex flex-col gap-2">
            {["Formas de pago", "Envíos", "Política de devoluciones", "Facturación", "Términos y condiciones"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {item}
              </a>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span>📍 Ignacio Crespo 1136, Recreo</span>
            <span>📞 (0342) 5128458</span>
            <span>🕐 Lun-Vie 8:00-18:00</span>
          </div>
        </div>
      </div>

      {/* BARRA INFERIOR */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          <span>© 2025 Electricidad Nestor. Todos los derechos reservados.</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} />
            <span>Sistema operativo · DUX ERP conectado</span>
          </div>
        </div>
      </div>

    </footer>
  );
}