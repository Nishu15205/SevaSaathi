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
  // Initialize ref from store so HMR/remount doesn't lose the user ID
  const currentUserRef = useRef<string | null>(useAuthStore.getState().user?.id || null);

  const userId = session?.user ? (session.user as any).id : null;

  useEffect(() => {
    // Keep ref in sync with store
    const storeUser = useAuthStore.getState().user;
    if (storeUser?.id) currentUserRef.current = storeUser.id;
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const u = session.user as any;
      const id = u.id;

      // Only set basic auth if we DON'T already have a user with this ID.
      // This prevents overwriting caregiverProfile/patientProfiles with null.
      // Also check localStorage to survive HMR/remounts.
      const existingUser = useAuthStore.getState().user;
      if (currentUserRef.current !== id) {
        // Check if we already have this user in the store (e.g., from localStorage)
        if (existingUser?.id === id) {
          // Same user, ref just reset (HMR/dev). Don't overwrite store data.
          currentUserRef.current = id;
        } else {
          currentUserRef.current = id;
          setAuth({
            id,
            email: u.email,
            name: u.name,
            phone: "",
            role: u.role,
            avatarUrl: u.image || null,
            subscription: "NONE" as any,
            patientProfiles: [],
            caregiverProfile: undefined,
          });
        }
      }

      // Fetch full user data (including caregiverProfile, patientProfiles) once
      if (id && fetchDoneRef.current !== id) {
        fetchDoneRef.current = id;
        fetch(`/api/auth/me?userId=${id}`)
          .then((res) => {
            if (!res.ok) return null;
            return res.json();
          })
          .then((data) => {
            if (!data?.user) return;
            const fullUser = data.user;
            // Only update if the session user hasn't changed
            if (currentUserRef.current !== id) return;

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
      currentUserRef.current = null;
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
