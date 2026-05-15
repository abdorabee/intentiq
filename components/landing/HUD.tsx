"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";

interface HUDProps {
  visible: boolean;
}

function DropdownLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block px-3 py-2 text-[13px] text-[#b4bbc8] transition-colors hover:bg-white/[0.05] hover:text-[#f7f8f8]"
    >
      {children}
    </Link>
  );
}

function NavDropdown({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details className="nav-dd relative" name="topnav">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-md px-3 py-1.5 text-[13px] text-[#b4bbc8] transition-colors hover:bg-white/[0.05] hover:text-[#f7f8f8]">
        {label}
        <ChevronDown className="nav-chevron h-3.5 w-3.5 opacity-55 transition-transform duration-200" />
      </summary>
      <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-[200px] rounded-lg border border-white/[0.08] bg-[#0e1011]/95 py-1 shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-md">
        {children}
      </div>
    </details>
  );
}

export default function HUD({ visible }: HUDProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!visible) return null;

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08090a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 md:h-[56px] lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-[15px] font-semibold tracking-tight text-[#f7f8f8]">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#5e6ad2] text-[11px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
              IQ
            </span>
            IntentIQ
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            <NavDropdown label="Product">
              <DropdownLink href="#signals">Intent signals</DropdownLink>
              <DropdownLink href="#how-it-works">How it works</DropdownLink>
            </NavDropdown>
            <NavDropdown label="Autopilot">
              <DropdownLink href="#">Rules & routing</DropdownLink>
              <DropdownLink href="#">Workflows</DropdownLink>
            </NavDropdown>
            <NavDropdown label="Developers">
              <DropdownLink href="#api">API reference</DropdownLink>
              <DropdownLink href="/docs">Documentation</DropdownLink>
            </NavDropdown>
            <Link
              href="#pricing"
              className="rounded-md px-3 py-1.5 text-[13px] text-[#b4bbc8] transition-colors hover:bg-white/[0.05] hover:text-[#f7f8f8]"
            >
              Pricing
            </Link>
            <Link
              href="#customers"
              className="rounded-md px-3 py-1.5 text-[13px] text-[#b4bbc8] transition-colors hover:bg-white/[0.05] hover:text-[#f7f8f8]"
            >
              Customers
            </Link>
            <NavDropdown label="Company">
              <DropdownLink href="#">About</DropdownLink>
              <DropdownLink href="/docs">Changelog</DropdownLink>
            </NavDropdown>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-[13px] text-[#b4bbc8] transition-colors hover:bg-white/[0.05] hover:text-[#f7f8f8]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.14] bg-transparent px-4 py-2 text-[13px] font-medium text-[#f7f8f8] shadow-none transition-colors hover:border-white/[0.22] hover:bg-white/[0.04]"
            >
              Sign up
              <span aria-hidden className="text-[#8a8f98]">
                →
              </span>
            </Link>
          </div>

          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-md text-[#b4bbc8] hover:bg-white/[0.06] hover:text-[#f7f8f8] md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#08090a]/98 backdrop-blur-lg md:hidden">
          <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-5">
            <span className="text-[15px] font-semibold text-[#f7f8f8]">Menu</span>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-md text-[#b4bbc8] hover:bg-white/[0.06]"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-0 overflow-y-auto p-5">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#62666d]">Product</p>
            <Link href="#signals" onClick={closeMenu} className="rounded-lg px-4 py-2.5 text-[15px] text-[#f7f8f8] hover:bg-white/[0.05]">
              Intent signals
            </Link>
            <Link href="#how-it-works" onClick={closeMenu} className="rounded-lg px-4 py-2.5 text-[15px] text-[#f7f8f8] hover:bg-white/[0.05]">
              How it works
            </Link>
            <p className="mb-1 mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[#62666d]">Autopilot</p>
            <Link href="#" onClick={closeMenu} className="rounded-lg px-4 py-2.5 text-[15px] text-[#b4bbc8] hover:bg-white/[0.05] hover:text-[#f7f8f8]">
              Rules & routing
            </Link>
            <Link href="#" onClick={closeMenu} className="rounded-lg px-4 py-2.5 text-[15px] text-[#b4bbc8] hover:bg-white/[0.05] hover:text-[#f7f8f8]">
              Workflows
            </Link>
            <p className="mb-1 mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[#62666d]">Developers</p>
            <Link href="#api" onClick={closeMenu} className="rounded-lg px-4 py-2.5 text-[15px] text-[#f7f8f8] hover:bg-white/[0.05]">
              API reference
            </Link>
            <Link href="/docs" onClick={closeMenu} className="rounded-lg px-4 py-2.5 text-[15px] text-[#f7f8f8] hover:bg-white/[0.05]">
              Documentation
            </Link>
            <p className="mb-1 mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[#62666d]">Pricing & company</p>
            <Link href="#pricing" onClick={closeMenu} className="rounded-lg px-4 py-2.5 text-[15px] text-[#f7f8f8] hover:bg-white/[0.05]">
              Pricing
            </Link>
            <Link href="#customers" onClick={closeMenu} className="rounded-lg px-4 py-2.5 text-[15px] text-[#f7f8f8] hover:bg-white/[0.05]">
              Customers
            </Link>
            <Link href="#" onClick={closeMenu} className="rounded-lg px-4 py-2.5 text-[15px] text-[#b4bbc8] hover:bg-white/[0.05] hover:text-[#f7f8f8]">
              About
            </Link>
            <Link href="/docs" onClick={closeMenu} className="rounded-lg px-4 py-2.5 text-[15px] text-[#b4bbc8] hover:bg-white/[0.05] hover:text-[#f7f8f8]">
              Changelog
            </Link>
            <div className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-6">
              <Link href="/login" onClick={closeMenu} className="rounded-lg px-4 py-3 text-center text-[15px] text-[#b4bbc8] hover:bg-white/[0.05] hover:text-[#f7f8f8]">
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={closeMenu}
                className="rounded-full border border-white/[0.14] px-4 py-3 text-center text-[15px] font-medium text-[#f7f8f8] hover:bg-white/[0.04]"
              >
                Sign up →
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
