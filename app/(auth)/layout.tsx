export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight">IntentIQ</h1>
          <p className="text-muted-foreground text-sm mt-1">Know which leads are ready to buy</p>
        </div>
        {children}
      </div>
    </div>
  );
}
