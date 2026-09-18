"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CuentaIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/cuenta/pedidos");
  }, [router]);

  return null;
}
