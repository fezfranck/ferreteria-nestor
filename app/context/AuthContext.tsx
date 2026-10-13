"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: "superadmin" | "admin" | "vendedor" | "comprador";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  registerUser: (email: string, password: string, nombre: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Escuchar cambios de estado de autenticación en Supabase
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.warn("Aviso al obtener sesión (posible sesión vencida o revocada):", error.message);
          await supabase.auth.signOut({ scope: "local" }).catch(() => {});
          if (isMounted) setUser(null);
          return;
        }

        const session = data?.session;
        if (session?.user) {
          // Verificar si el token ya expiró
          if (session.expires_at && session.expires_at * 1000 < Date.now()) {
            console.warn("Token de sesión expirado. Intentando refrescar...");
            const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
            if (refreshErr || !refreshData.session?.user) {
              console.warn("No se pudo refrescar la sesión expirada. Limpiando sesión:", refreshErr?.message);
              await supabase.auth.signOut({ scope: "local" }).catch(() => {});
              if (isMounted) setUser(null);
              return;
            }
            if (isMounted) {
              await fetchUserProfile(refreshData.session.user.id);
            }
          } else {
            if (isMounted) {
              await fetchUserProfile(session.user.id);
            }
          }
        } else {
          if (isMounted) setUser(null);
        }
      } catch (err) {
        console.error("Excepción en initSession:", err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === "SIGNED_OUT" || !session?.user) {
          if (isMounted) setUser(null);
        } else if (session?.user) {
          if (isMounted) {
            await fetchUserProfile(session.user.id);
          }
        }
      } catch (err) {
        console.error("Error en onAuthStateChange:", err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nombre, email, rol")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setUser({
          id: data.id,
          nombre: data.nombre,
          email: data.email,
          rol: data.rol,
        });
      } else {
        console.warn("Error al cargar perfil de usuario o sesión inválida:", error?.message);
        setUser(null);
        // Si no se encuentra el perfil o el token fue rechazado, limpiar sesión local
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      }
    } catch (err) {
      console.error("Connection error loading profile:", err);
      setUser(null);
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Login error:", error.message);
      return false;
    }
    return true;
  }

  async function logout() {
    try {
      // Intentar cerrar sesión local y remota sin fallar si el token ya expiró
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      await supabase.auth.signOut().catch(() => {});
    } catch (err) {
      console.warn("Aviso al cerrar sesión:", err);
    } finally {
      setUser(null);
      // Limpiar cualquier residuo de autenticación en localStorage
      if (typeof window !== "undefined") {
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes("supabase.auth.token") || key.includes("sb-") || key.includes("auth-token"))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        } catch {}
      }
    }
  }

  async function registerUser(email: string, password: string, nombre: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          rol: "comprador",
        },
      },
    });

    if (error) {
      console.error("Register error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async function refreshUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (err) {
      console.error("Error en refreshUser:", err);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, registerUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}