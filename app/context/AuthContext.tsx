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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  registerUser: (email: string, password: string, nombre: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Escuchar cambios de estado de autenticación en Supabase
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
        console.error("Error fetching user profile:", error);
        setUser(null);
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
    await supabase.auth.signOut();
    setUser(null);
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

  return (
    <AuthContext.Provider value={{ user, login, logout, registerUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}