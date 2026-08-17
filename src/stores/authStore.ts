"use client";

import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "FAMILY" | "CAREGIVER" | "ADMIN";
  avatarUrl?: string | null;
  subscription?: string;
  patientProfiles?: { id: string; name: string; age: number; gender: string; relationship: string; city: string; mobilityStatus: string; isActive: boolean }[];
  caregiverProfile?: {
    id: string;
    city: string;
    yearsExperience: number;
    skills: string;
    languages?: string | null;
    hourlyRate: number;
    overallRating: number;
    totalReviews: number;
    completedJobs: number;
    isVerified: boolean;
    bio?: string | null;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("sevasaathi_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: (() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("sevasaathi_user");
  })(),
  setAuth: (user: User) => {
    localStorage.setItem("sevasaathi_user", JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  clearAuth: () => {
    localStorage.removeItem("sevasaathi_user");
    set({ user: null, isAuthenticated: false });
  },
}));
