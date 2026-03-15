"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";

interface HUDProps {
  visible: boolean;
}

const NAV_LINKS = [
  { href: "#signals", label: "SIGNALS" },
  { href: "#api", label: "API" },
  { href: "#pricing", label: "PRICING" },
  { href: "/login", label: "SIGN IN" },
  { href: "/signup", label: "START FREE", highlight: true },
];

export default function HUD({ visible }: HUDProps) {
  const hudRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useGSAP(() => {
    if (!visible || !hudRef.current) return;

    const elements = hudRef.current.querySelectorAll("[data-hud]");
    gsap.set(elements, { opacity: 0 });
    gsap.to(elements, { opacity: 1, stagger: 0.15, duration: 0.6, ease: "power2.out", delay: 0.3 });
  }, { dependencies: [visible], scope: hudRef });

  // Animate mobile menu
  useGSAP(() => {
    if (!overlayRef.current) return;
    const links = overlayRef.current.querySelectorAll("[data-menu-link]");

    if (menuOpen) {
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.set(links, { opacity: 0, y: 20 });
      gsap.to(links, { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: "power2.out", delay: 0.15 });
    }
  }, { dependencies: [menuOpen] });

  if (!visible) return null;

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div ref={hudRef} className="fixed inset-0 z-40 pointer-events-none">
        {/* Top-left: Logo + version */}
        <div data-hud className="absolute top-5 left-6">
          <p className="text-white text-xs tracking-[0.15em] leading-tight font-medium pointer-events-auto">
            INTENT
            <br />
            IQ
          </p>
          <p className="text-slate-500 text-[10px] tracking-[0.2em] mt-1">1.0</p>
        </div>

        {/* Top-right: Desktop menu */}
        <div data-hud className="absolute top-5 right-6 hidden md:block">
          <nav className="flex items-center gap-6 pointer-events-auto">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs tracking-[0.2em] transition-colors ${
                  link.highlight
                    ? "text-cyan-400 hover:text-cyan-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Top-right: Mobile hamburger */}
        <div data-hud className="absolute top-5 right-6 md:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="pointer-events-auto flex flex-col gap-1.5 p-2 cursor-pointer"
            aria-label="Open menu"
          >
            <span className="block w-5 h-px bg-slate-300" />
            <span className="block w-5 h-px bg-slate-300" />
            <span className="block w-3 h-px bg-cyan-400" />
          </button>
        </div>

        {/* Bottom-right: Contact info */}
        <div data-hud className="absolute bottom-5 right-6 text-right hidden md:block">
          <p className="text-slate-500 text-[10px] tracking-[0.15em]">hello@intentiq.com</p>
          <p className="text-slate-600 text-[10px] tracking-[0.15em]">API v1 · Live</p>
        </div>
      </div>

      {/* Mobile fullscreen overlay menu */}
      {menuOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
        >
          {/* Close button */}
          <button
            onClick={closeMenu}
            className="absolute top-5 right-6 text-slate-400 hover:text-white transition-colors p-2 cursor-pointer"
            aria-label="Close menu"
          >
            <span className="text-lg tracking-[0.2em]">[X]</span>
          </button>

          {/* Logo */}
          <div className="absolute top-5 left-6">
            <p className="text-white text-xs tracking-[0.15em] leading-tight font-medium">
              INTENT
              <br />
              IQ
            </p>
          </div>

          {/* Menu links */}
          <nav className="flex flex-col items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-menu-link
                onClick={closeMenu}
                className={`text-sm tracking-[0.3em] transition-colors ${
                  link.highlight
                    ? "text-cyan-400 hover:text-cyan-300"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                [ {link.label} ]
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
