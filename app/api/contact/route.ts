import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  reason:   z.string().min(1),
  name:     z.string().min(1).max(120),
  email:    z.string().email(),
  company:  z.string().max(120).optional(),
  teamSize: z.string().optional(),
  message:  z.string().max(4000).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { reason, name, email, company, teamSize, message } = parsed.data;

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:    "IntentIQ Contact <onboarding@resend.dev>",
        to:      ["abdorabee1134@gmail.com"],
        replyTo: email,
        subject: `[Contact] ${reason} — ${name}${company ? ` · ${company}` : ""}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
            <h2 style="margin-bottom:4px">New contact form submission</h2>
            <p style="color:#666;margin-top:0">via IntentIQ contact page</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;width:120px">Name</td><td style="padding:8px 0;border-bottom:1px solid #eee">${name}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#888">Email</td><td style="padding:8px 0;border-bottom:1px solid #eee"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#888">Company</td><td style="padding:8px 0;border-bottom:1px solid #eee">${company || "—"}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#888">Team size</td><td style="padding:8px 0;border-bottom:1px solid #eee">${teamSize || "—"}</td></tr>
              <tr><td style="padding:8px 0;color:#888">Reason</td><td style="padding:8px 0">${reason}</td></tr>
            </table>
            ${message ? `<h3 style="margin-bottom:8px">Message</h3><p style="white-space:pre-wrap;background:#f9f9f9;padding:16px;border-radius:6px;color:#333">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : ""}
          </div>
        `,
      });
    } catch (err) {
      console.error("[contact] Resend error:", err);
      // Still return success — don't block the user on email errors
    }
  } else {
    // Dev fallback: log to console
    console.log("[contact form submission]", { reason, name, email, company, teamSize, message });
  }

  return NextResponse.json({ ok: true });
}
