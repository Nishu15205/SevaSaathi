"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/stores/authStore";

function AuthSync() {
  const { data: session, status } = useSession();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const fetchDoneRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const u = session.user as any;
      const userId = u.id;

      // Set basic auth immediately from session data so UI never shows null user
      setAuth({
        id: userId,
        email: u.email,
        name: u.name,
        phone: "",
        role: u.role,
        avatarUrl: u.image || null,
        subscription: "NONE" as any,
        patientProfiles: [],
        caregiverProfile: null,
      });

      // Fetch full user data (including caregiverProfile, patientProfiles) once
      if (userId && fetchDoneRef.current !== userId) {
        fetchDoneRef.current = userId;
        fetch(`/api/auth/me?userId=${userId}`)
          .then((res) => {
            if (!res.ok) return null;
            return res.json();
          })
          .then((data) => {
            if (!data?.user) return;
            const fullUser = data.user;
            // Only update if the session user hasn't changed
            const current = useAuthStore.getState().user;
            if (current?.id !== userId) return;

            setAuth({
              id: fullUser.id,
              email: fullUser.email,
              name: fullUser.name,
              phone: fullUser.phone || "",
              role: fullUser.role,
              avatarUrl: fullUser.avatarUrl || null,
              subscription: fullUser.subscription || "NONE",
              patientProfiles: fullUser.patientProfiles || [],
              caregiverProfile: fullUser.caregiverProfile || null,
            });
          })
          .catch(() => {
            // Silently fail - the basic session data is already set
          });
      }
    } else if (status === "unauthenticated") {
      fetchDoneRef.current = null;
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
