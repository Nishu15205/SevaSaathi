"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/stores/authStore";

function AuthSync() {
  const { data: session, status } = useSession();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const u = session.user as any;
      setAuth({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: "",
        role: u.role,
        avatarUrl: u.image || null,
        subscription: "NONE" as any,
        patientProfiles: [],
        caregiverProfile: null,
      });
    } else if (status === "unauthenticated") {
      clearAuth();
    }
  }, [session, status, setAuth, clearAuth]);

  return null;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <AuthSync />
      {children}
    </NextAuthSessionProvider>
  );
}
