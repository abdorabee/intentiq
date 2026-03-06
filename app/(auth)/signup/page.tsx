"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = [
  "CRM / Sales Tools", "Marketing Automation", "HR / Recruiting",
  "Finance / Accounting", "DevTools / APIs", "Security", "Data & Analytics",
  "E-commerce", "Other B2B SaaS",
];

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup() {
    if (!email || !category) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { product_category: category },
      },
    });

    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sent ? (
          <p className="text-sm text-center text-muted-foreground">
            Check your email at <strong>{email}</strong> to confirm your account.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">What do you sell?</Label>
              <select
                id="category"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Used to tailor AI reasoning to your product context.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleSignup} disabled={loading}>
              {loading ? "Creating account…" : "Get started free"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              20 free credits. No credit card required.
            </p>
          </>
        )}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
