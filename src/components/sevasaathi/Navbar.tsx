"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Heart,
  Menu,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LoginModal from "@/components/sevasaathi/LoginModal";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Smart Matching", href: "#matching" },
  { label: "Trust & Safety", href: "#trust" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('sevasaathi_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("sevasaathi_user");
    setUser(null);
  }, []);

  return (
    <>
      {/* Green announcement bar */}
      <div className="green-gradient-bg text-white text-center py-2 px-4 text-sm font-medium">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          Now serving Delhi NCR — Verified caregivers at your doorstep
          <span className="inline-block w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
        </span>
      </div>

      {/* Main navbar */}
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
            {/* Left nav links (desktop) */}
            <div className="hidden lg:flex items-center gap-1 flex-1">
              {navLinks.slice(0, 3).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-forest-800 transition-colors rounded-full"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Center logo */}
            <a href="#" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-800 group-hover:bg-forest-700 transition-colors">
                <Heart className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                SevaSaathi
              </span>
            </a>

            {/* Right side (desktop) */}
            <div className="hidden lg:flex items-center gap-3 flex-1 justify-end">
              {navLinks.slice(3).map((link) => (
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
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
                    <div className="w-6 h-6 rounded-full bg-forest-800 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="px-4 py-2 text-sm font-semibold text-gray-800 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="btn-black px-5 py-2 text-sm"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="flex items-center gap-2 lg:hidden">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-forest-800 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setLoginOpen(true)}
                  className="btn-black px-4 py-1.5 text-xs"
                >
                  Login
                </button>
              )}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-700">
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
                      {user ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-forest-800 flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.role}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => { handleLogout(); setMobileOpen(false); }}
                            className="text-sm font-medium text-red-500 hover:text-red-700"
                          >
                            Logout
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => { setLoginOpen(true); setMobileOpen(false); }}
                            className="w-full py-2.5 text-sm font-semibold text-gray-800 border border-gray-200 rounded-full"
                          >
                            Login
                          </button>
                          <button
                            onClick={() => { setLoginOpen(true); setMobileOpen(false); }}
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

      {/* Login Modal */}
      <AnimatePresence>
        {loginOpen && (
          <LoginModal
            isOpen={loginOpen}
            onClose={() => setLoginOpen(false)}
            onLogin={(userData) => {
              setUser(userData);
              localStorage.setItem("sevasaathi_user", JSON.stringify(userData));
              setLoginOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
