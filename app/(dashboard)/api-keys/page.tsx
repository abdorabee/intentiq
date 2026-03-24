import { Card, CardContent } from "@/components/ui/card";
import { Key } from "lucide-react";

export default function ApiKeysPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <span className="text-cyan-400 text-xs tracking-[0.25em] uppercase">[API KEYS]</span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">API Access</h1>
        <p className="text-slate-500 text-sm tracking-[0.05em] mt-1">Programmatic access to IntentIQ scoring.</p>
      </div>

      <Card className="border-slate-200 dark:border-white/[0.08]">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
            <Key className="h-7 w-7 text-cyan-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Coming Soon</h2>
          <p className="text-sm text-slate-500 max-w-sm">
            API key management and programmatic access are on the way. Stay tuned.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
