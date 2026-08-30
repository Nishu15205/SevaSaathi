"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Heart,
  Menu,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useHydrated } from "@/hooks/useHydrated";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Smart Matching", href: "#matching" },
  { label: "Trust & Safety", href: "#trust" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

export default function Navbar({
  onGoDashboard,
  loginOpen,
  setLoginOpen,
}: {
  onGoDashboard: () => void;
  loginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hydrated = useHydrated();
  // Treat user as null until client hydration to prevent mismatch
  const rawUser = useAuthStore((s) => s.user);
  const user = hydrated ? rawUser : null;
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const openLogin = () => setLoginOpen(true);

  return (
    <>
      <div className="green-gradient-bg text-white text-center py-2 px-4 text-sm font-medium">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          Now serving Delhi NCR - Verified caregivers at your doorstep
          <span className="inline-block w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
        </span>
      </div>

      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-gray-100"
            : "bg-white"
        }`}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="hidden lg:flex items-center gap-1 flex-1">
              {!user &&
                navLinks.slice(0, 3).map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-forest-800 transition-colors rounded-full"
                  >
                    {link.label}
                  </a>
                ))}
            </div>

            <button
              onClick={user ? onGoDashboard : undefined}
              className="flex items-center gap-2 group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-800 group-hover:bg-forest-700 transition-colors">
                <Heart className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                SevaSaathi
              </span>
            </button>

            <div className="hidden lg:flex items-center gap-3 flex-1 justify-end">
              {!user &&
                navLinks.slice(3).map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-forest-800 transition-colors rounded-full"
                  >
                    {link.label}
                  </a>
                ))}

              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onGoDashboard}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-forest-800 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user.name}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                      {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                    </span>
                  </button>
                  <button
                    onClick={onGoDashboard}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="Dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={openLogin}
                    className="px-4 py-2 text-sm font-semibold text-gray-800 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={openLogin}
                    className="btn-black px-5 py-2 text-sm"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              {user ? (
                <>
                  <button
                    onClick={onGoDashboard}
                    className="btn-black px-3 py-1.5 text-xs"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                  </button>
                </>
              ) : (
                <button
                  onClick={openLogin}
                  className="btn-black px-4 py-1.5 text-xs"
                >
                  Login
                </button>
              )}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-700"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 pt-8">
                  <div className="flex flex-col gap-1">
                    {navLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="px-4 py-3 text-base font-medium text-gray-700 hover:text-forest-800 hover:bg-gray-50 rounded-2xl transition-colors"
                      >
                        {link.label}
                      </a>
                    ))}
                    <div className="mt-6 px-4">
                      {!user && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              openLogin();
                              setMobileOpen(false);
                            }}
                            className="w-full py-2.5 text-sm font-semibold text-gray-800 border border-gray-200 rounded-full"
                          >
                            Login
                          </button>
                          <button
                            onClick={() => {
                              openLogin();
                              setMobileOpen(false);
                            }}
                            className="btn-black w-full py-2.5 text-sm"
                          >
                            Get Started
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </motion.header>
    </>
  );
}
