"use client";

import Link from "next/link";

interface BracketButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function BracketButton({ children, href, onClick, size = "md", className = "" }: BracketButtonProps) {
  const sizeClasses = {
    sm: "px-5 py-2 text-xs",
    md: "px-8 py-3 text-sm",
    lg: "px-12 py-4 text-base",
  };

  const inner = (
    <>
      <span className="bracket-corner tl" />
      <span className="bracket-corner tr" />
      <span className="bracket-corner bl" />
      <span className="bracket-corner br" />
      <span className="relative z-10 tracking-[0.2em] uppercase">{children}</span>
    </>
  );

  const baseClasses = `relative inline-flex items-center justify-center text-slate-200 hover:text-white transition-all duration-300 cursor-pointer group ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {inner}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      {inner}
    </button>
  );
}
