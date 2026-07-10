"use client";
import { createContext, useContext, useState } from "react";

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: "superadmin" | "admin" | "vendedor" | "comprador";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Usuarios de prueba — después los conectamos a Supabase Auth
const USUARIOS = [
  { id: "1", nombre: "Nestor Admin", email: "admin@nestor.com", password: "admin123", rol: "superadmin" as const },
  { id: "2", nombre: "Maria Lopez", email: "maria@nestor.com", password: "maria123", rol: "admin" as const },
  { id: "3", nombre: "Carlos Ruiz", email: "carlos@nestor.com", password: "carlos123", rol: "vendedor" as const },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  async function login(email: string, password: string): Promise<boolean> {
    const found = USUARIOS.find(
      (u) => u.email === email && u.password === password
    );
    if (found) {
      setUser({ id: found.id, nombre: found.nombre, email: found.email, rol: found.rol });
      return true;
    }
    return false;
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}