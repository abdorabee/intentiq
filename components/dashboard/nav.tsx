"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard"     },
  { href: "/score",      label: "Score Explorer" },
  { href: "/history",    label: "Score History"  },
  { href: "/watchlist",  label: "Watchlist"     },
  { href: "/bulk",       label: "Bulk Scorer"   },
  { href: "/api-keys",   label: "API Keys"      },
  { href: "/billing",    label: "Billing"       },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-56 flex-col border-r border-subtle bg-white p-4 space-y-1">
      <div className="mb-6 px-3">
        <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
          IntentIQ
        </span>
      </div>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-indigo-50 hover:text-indigo-700",
            pathname === item.href
              ? "bg-indigo-50 text-indigo-700 font-semibold"
              : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}

      <div className="mt-auto pt-4">
        <SignOutButton redirectUrl="/">
          <button className="w-full rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 text-left">
            Sign out
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
