export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#020617] overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-60 -left-40 w-[700px] h-[700px] rounded-full bg-indigo-600/20 blur-[140px] animate-orb" />
        <div className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px] animate-orb-slow" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-900/25 blur-[130px] animate-orb-med" />
      </div>

      <div className="relative w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight text-gradient">IntentIQ</h1>
          <p className="text-slate-400 text-sm mt-1">Know which leads are ready to buy</p>
        </div>
        <div className="glass rounded-2xl p-1">
          {children}
        </div>
      </div>
    </div>
  );
}
