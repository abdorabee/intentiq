"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard"  },
  { href: "/score",      label: "Score Explorer" },
  { href: "/watchlist",  label: "Watchlist"  },
  { href: "/bulk",       label: "Bulk Scorer" },
  { href: "/api-keys",   label: "API Keys"   },
  { href: "/billing",    label: "Billing"    },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-56 flex-col border-r bg-muted/30 p-4 space-y-1">
      <div className="mb-6 px-2">
        <span className="text-xl font-black">IntentIQ</span>
      </div>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            pathname === item.href
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </aside>
  );
}
