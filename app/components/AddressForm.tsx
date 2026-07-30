"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface Direccion {
  provincia: string;
  localidad: string;
  calle: string;
  altura: string;
  piso: string;
  indicaciones: string;
  codigoPostal: string;
  lat: number | null;
  lon: number | null;
}

interface Props {
  onDireccionValida: (direccion: Direccion) => void;
}

const GEOREF_BASE = "https://apis.datos.gob.ar/georef/api";

export default function AddressForm({ onDireccionValida }: Props) {
  const [provincias, setProvincias] = useState<{ id: string; nombre: string }[]>([]);
  const [localidades, setLocalidades] = useState<{ id: string; nombre: string }[]>([]);
  const [calleSugerencias, setCalleSugerencias] = useState<string[]>([]);

  const [provincia, setProvincia] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [calle, setCalle] = useState("");
  const [altura, setAltura] = useState("");
  const [piso, setPiso] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");

  const [verificando, setVerificando] = useState(false);
  const [direccionConfirmada, setDireccionConfirmada] = useState(false);
  const [errorDireccion, setErrorDireccion] = useState("");
  const [errorCP, setErrorCP] = useState("");

  useEffect(() => {
    fetch(`${GEOREF_BASE}/provincias?campos=id,nombre&max=30`)
      .then(r => r.json())
      .then(data => setProvincias(data.provincias.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre))));
  }, []);

  useEffect(() => {
    if (!provincia) { setLocalidades([]); return; }
    fetch(`${GEOREF_BASE}/localidades?provincia=${encodeURIComponent(provincia)}&campos=id,nombre&max=500`)
      .then(r => r.json())
      .then(data => setLocalidades(data.localidades.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre))));
    setLocalidad("");
    setDireccionConfirmada(false);
  }, [provincia]);

  useEffect(() => {
    if (calle.length < 3 || !localidad) { setCalleSugerencias([]); return; }
    const timeout = setTimeout(() => {
      fetch(`${GEOREF_BASE}/calles?nombre=${encodeURIComponent(calle)}&localidad_censal=${encodeURIComponent(localidad)}&campos=nombre&max=8`)
        .then(r => r.json())
        .then(data => setCalleSugerencias([...new Set(data.calles.map((c: any) => c.nombre))] as string[]))
        .catch(() => setCalleSugerencias([]));
    }, 350);
    return () => clearTimeout(timeout);
  }, [calle, localidad]);

  async function verificarDireccion() {
    setErrorDireccion("");
    setErrorCP("");
    setDireccionConfirmada(false);

    if (!provincia || !localidad || !calle || !altura || !codigoPostal) {
      setErrorDireccion("Completá provincia, localidad, calle, altura y código postal.");
      return;
    }

    setVerificando(true);

    try {
      const resDireccion = await fetch(
        `${GEOREF_BASE}/direcciones?localidad_censal=${encodeURIComponent(localidad)}&direccion=${encodeURIComponent(`${calle} ${altura}`)}&max=1`
      );
      const dataDireccion = await resDireccion.json();

      if (!dataDireccion.direcciones || dataDireccion.direcciones.length === 0) {
        setErrorDireccion("No pudimos confirmar que esa calle y altura existan en la localidad elegida. Revisá los datos.");
        setVerificando(false);
        return;
      }

      const ubicacion = dataDireccion.direcciones[0].ubicacion;

      const { data: cpValido, error } = await supabase.rpc("validar_codigo_postal", {
        cp_input: codigoPostal.trim(),
        localidad_input: localidad,
        provincia_input: provincia,
      });

      if (error) {
        console.error("Error validando CP:", error);
        setErrorCP("No pudimos validar el código postal en este momento.");
        setVerificando(false);
        return;
      }

      if (!cpValido) {
        setErrorCP("Ese código postal no corresponde a la localidad elegida. Verificalo.");
        setVerificando(false);
        return;
      }

      setDireccionConfirmada(true);
      onDireccionValida({
        provincia, localidad, calle, altura, piso, indicaciones,
        codigoPostal: codigoPostal.trim(),
        lat: ubicacion.lat, lon: ubicacion.lon,
      });
    } catch (err) {
      setErrorDireccion("No pudimos verificar la dirección. Probá de nuevo en un momento.");
    }

    setVerificando(false);
  }

  const inputStyle = "w-full px-4 py-2.5 text-sm rounded-lg outline-none border border-black/12 focus:border-[#1B87C8] transition-colors";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Provincia *</label>
          <select className={inputStyle} value={provincia} onChange={e => setProvincia(e.target.value)}>
            <option value="">Elegir...</option>
            {provincias.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Localidad *</label>
          <select className={inputStyle} value={localidad} onChange={e => setLocalidad(e.target.value)} disabled={!provincia}>
            <option value="">Elegir...</option>
            {localidades.map(l => <option key={l.id} value={l.nombre}>{l.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 relative">
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Calle *</label>
          <input
            className={inputStyle}
            value={calle}
            onChange={e => setCalle(e.target.value)}
            placeholder="Nombre de la calle"
            disabled={!localidad}
            autoComplete="off"
          />
          {calleSugerencias.length > 0 && (
            <div className="absolute z-10 bg-white border border-black/10 rounded-lg mt-1 w-full shadow-lg max-h-40 overflow-y-auto">
              {calleSugerencias.map(s => (
                <button
                  key={s}
                  type="button"
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-[#F0F7FD]"
                  onClick={() => { setCalle(s); setCalleSugerencias([]); }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Altura *</label>
          <input className={inputStyle} type="text" inputMode="numeric" value={altura} onChange={e => setAltura(e.target.value)} placeholder="1234" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Código Postal *</label>
          <input className={inputStyle} value={codigoPostal} onChange={e => setCodigoPostal(e.target.value)} placeholder="3400" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Piso / Depto (opcional)</label>
          <input className={inputStyle} value={piso} onChange={e => setPiso(e.target.value)} placeholder="3° B" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Indicaciones (opcional)</label>
        <textarea className={inputStyle} rows={2} value={indicaciones} onChange={e => setIndicaciones(e.target.value)} placeholder="Portón verde, timbre 2, entre calles..." />
      </div>

      {errorDireccion && (
        <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626" }}>
          ❌ {errorDireccion}
        </div>
      )}
      {errorCP && (
        <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626" }}>
          ❌ {errorCP}
        </div>
      )}
      {direccionConfirmada && (
        <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(22,163,74,0.08)", color: "#16A34A" }}>
          ✅ Dirección verificada correctamente
        </div>
      )}

      <button
        type="button"
        onClick={verificarDireccion}
        disabled={verificando}
        className="w-full py-3 rounded-full font-semibold text-sm transition-all"
        style={{ background: "#1B87C8", color: "white" }}
      >
        {verificando ? "Verificando..." : "Verificar dirección"}
      </button>
    </div>
  );
}