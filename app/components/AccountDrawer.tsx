"use client";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountDrawer({ isOpen, onClose }: Props) {
  const { user, login, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [regNombre, setRegNombre] = useState("");
  const [regApellido, setRegApellido] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regDireccion, setRegDireccion] = useState("");
  const [regLocalidad, setRegLocalidad] = useState("");
  const [regCP, setRegCP] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const ok = await login(loginEmail, loginPassword);
    if (!ok) {
      setLoginError("Correo o contraseña incorrectos.");
    }
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    if (regPassword !== regPassword2) {
      setRegError("Las contraseñas no coinciden.");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setRegSuccess(true);
    setTimeout(() => {
      setRegSuccess(false);
      setTab("login");
    }, 2000);
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    fontSize: "13px",
    borderRadius: "8px",
    border: "1.5px solid rgba(0,0,0,0.12)",
    outline: "none",
    background: "#fafafa",
    color: "#1A1A1A",
  };

  return (
    <>
      {/* FONDO OSCURO */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}

      {/* PANEL */}
      <div
        className="fixed top-0 right-0 h-full flex flex-col z-50"
        style={{
          width: "380px",
          background: "white",
          boxShadow: "-4px 0 40px rgba(0,0,0,0.15)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* HEADER */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
        >
          <h2
            className="font-black uppercase text-xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {user ? "Mi Cuenta" : "🔐 Mi Cuenta"}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-colors"
            style={{ color: "#aaa" }}
          >
            ✕
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto">

          {/* SI ESTÁ LOGUEADO */}
          {user ? (
            <div className="p-6">
              <div
                className="flex items-center gap-4 p-4 rounded-xl mb-6"
                style={{ background: "#F0F7FD", border: "1px solid #D6EAF8" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xl text-white flex-shrink-0"
                  style={{ background: "#1B87C8" }}
                >
                  {user.nombre.charAt(0)}
                </div>
                <div>
                  <div className="font-bold">{user.nombre}</div>
                  <div className="text-sm" style={{ color: "#555" }}>{user.email}</div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ background: "#1B87C820", color: "#1B87C8" }}
                  >
                    {user.rol}
                  </span>
                </div>
              </div>

              {/* Opciones */}
              <div className="flex flex-col gap-2 mb-6">
                {[
                  { icon: "🛒", label: "Mis pedidos", action: () => {} },
                  { icon: "👤", label: "Mis datos", action: () => {} },
                  { icon: "📍", label: "Mis direcciones", action: () => {} },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all"
                    style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    <span className="ml-auto" style={{ color: "#aaa" }}>→</span>
                  </button>
                ))}
              </div>

              {/* Admin */}
              {["superadmin", "admin", "vendedor"].includes(user.rol) && (
                <button
                  onClick={() => { router.push("/admin/dashboard"); onClose(); }}
                  className="w-full py-3 rounded-xl font-bold text-sm mb-3 transition-all"
                  style={{ background: "#1B87C8", color: "white" }}
                >
                  ⚙️ Panel de administración
                </button>
              )}

              <button
                onClick={() => { logout(); onClose(); }}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" }}
              >
                🚪 Cerrar sesión
              </button>
            </div>
          ) : (
            /* SI NO ESTÁ LOGUEADO */
            <div>
              {/* TABS */}
              <div
                className="flex"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
              >
                {[
                  { id: "login", label: "Iniciar Sesión" },
                  { id: "register", label: "Crear Cuenta" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id as "login" | "register")}
                    className="flex-1 py-3 text-sm font-bold transition-all"
                    style={{
                      borderBottom: tab === t.id ? "2px solid #1B87C8" : "2px solid transparent",
                      color: tab === t.id ? "#1B87C8" : "#aaa",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* LOGIN */}
              {tab === "login" && (
                <div className="p-6">
                  {loginError && (
                    <div
                      className="rounded-lg px-4 py-3 mb-4 text-sm"
                      style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" }}
                    >
                      ❌ {loginError}
                    </div>
                  )}
                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-2">Correo</label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        required
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-2">Contraseña</label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        style={inputStyle}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 rounded-lg font-bold text-sm transition-all"
                      style={{ background: "#1B87C8", color: "white" }}
                    >
                      Ingresar →
                    </button>
                  </form>
                  <p className="text-center mt-4 text-sm" style={{ color: "#555" }}>
                    No tenes cuenta?{" "}
                    <button
                      onClick={() => setTab("register")}
                      className="font-bold"
                      style={{ color: "#1B87C8" }}
                    >
                      Crear una
                    </button>
                  </p>
                </div>
              )}

              {/* REGISTRO */}
              {tab === "register" && (
                <div className="p-6">
                  {regError && (
                    <div
                      className="rounded-lg px-4 py-3 mb-4 text-sm"
                      style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" }}
                    >
                      ❌ {regError}
                    </div>
                  )}
                  {regSuccess && (
                    <div
                      className="rounded-lg px-4 py-3 mb-4 text-sm"
                      style={{ background: "rgba(22,163,74,0.08)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.2)" }}
                    >
                      Cuenta creada exitosamente!
                    </div>
                  )}
                  <form onSubmit={handleRegister} className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-2">Nombre</label>
                        <input type="text" value={regNombre} onChange={e => setRegNombre(e.target.value)} placeholder="Tu nombre" required style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-2">Apellido</label>
                        <input type="text" value={regApellido} onChange={e => setRegApellido(e.target.value)} placeholder="Tu apellido" required style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-2">Correo</label>
                      <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="tu@correo.com" required style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-2">Telefono</label>
                      <input type="tel" value={regTelefono} onChange={e => setRegTelefono(e.target.value)} placeholder="+54 342 ..." required style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-2">Direccion</label>
                      <input type="text" value={regDireccion} onChange={e => setRegDireccion(e.target.value)} placeholder="Calle y numero" required style={inputStyle} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-2">Localidad</label>
                        <input type="text" value={regLocalidad} onChange={e => setRegLocalidad(e.target.value)} placeholder="Ciudad" required style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-2">CP</label>
                        <input type="text" value={regCP} onChange={e => setRegCP(e.target.value)} placeholder="3400" required style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-2">Contrasena</label>
                      <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Minimo 6 caracteres" required minLength={6} style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-2">Repetir Contrasena</label>
                      <input type="password" value={regPassword2} onChange={e => setRegPassword2(e.target.value)} placeholder="Repetila" required style={inputStyle} />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 rounded-lg font-bold text-sm transition-all mt-1"
                      style={{ background: "#1B87C8", color: "white" }}
                    >
                      Crear Cuenta →
                    </button>
                  </form>
                  <p className="text-center mt-4 text-sm" style={{ color: "#555" }}>
                    Ya tenes cuenta?{" "}
                    <button onClick={() => setTab("login")} className="font-bold" style={{ color: "#1B87C8" }}>
                      Iniciar Sesion
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}