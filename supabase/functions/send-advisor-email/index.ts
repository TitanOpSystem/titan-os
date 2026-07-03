// supabase/functions/send-advisor-email/index.ts
// PCM Family Office — client emails an advisor through the platform.
//
// Why server-side: it lets us (1) force the primary advisor onto CC in a way the
// client CANNOT remove, and (2) set reply-to to the client's real email so the
// advisor replies straight to them. The client only supplies the recipient +
// message; everything trust-sensitive (which family, who the primary advisor is,
// whether the recipient is even allowed) is decided here from the database.
//
// Deploy:  supabase functions deploy send-advisor-email
// Secrets: RESEND_API_KEY (already set for reminders)
//          ADVISOR_EMAIL_FROM  e.g.  PCM Family Office <notifications@yourverifieddomain.com>
//                              (must be a Resend-verified sender/domain)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = Deno.env.get("ADVISOR_EMAIL_FROM") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
const clean = (s: string) => String(s || "").replace(/[\r\n<>]/g, " ").trim();
const esc = (s: string) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    if (!RESEND_API_KEY) return json({ error: "Email is not configured (missing API key)." }, 500);
    if (!FROM) return json({ error: "Email sender is not configured. Set ADVISOR_EMAIL_FROM." }, 500);

    // Who is calling (from their token — cannot be spoofed)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Not authenticated." }, 401);
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uErr } = await anon.auth.getUser(token);
    if (uErr || !user) return json({ error: "Not authenticated." }, 401);
    const clientEmail = user.email || "";

    const body = await req.json().catch(() => null);
    const toEmail = clean(body?.toEmail).toLowerCase();
    const subject = clean(body?.subject).slice(0, 200) || "Message from your client";
    const message = String(body?.message || "").slice(0, 20000);
    if (!toEmail) return json({ error: "Missing recipient." }, 400);
    if (!message.trim()) return json({ error: "Message is empty." }, 400);

    // Everything trust-sensitive is read server-side with the service role.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: profile } = await admin.from("user_profiles").select("family_id, full_name").eq("id", user.id).single();
    const familyId = profile?.family_id;
    if (!familyId) return json({ error: "No family is associated with your account." }, 403);
    const clientName = clean(profile?.full_name) || clientEmail;

    const { data: fam } = await admin.from("families").select("advisor_name, advisor_email").eq("id", familyId).single();
    const primaryEmail = (fam?.advisor_email || "").trim().toLowerCase();
    const primaryName = clean(fam?.advisor_name);

    const { data: advisorContacts } = await admin.from("contacts").select("email").eq("family_id", familyId).eq("is_advisor", true);
    const allowed = new Set<string>();
    if (primaryEmail) allowed.add(primaryEmail);
    (advisorContacts || []).forEach((c: { email: string }) => { const e = (c.email || "").trim().toLowerCase(); if (e) allowed.add(e); });

    // Recipient must be a real advisor option for THIS family — no arbitrary sends.
    if (!allowed.has(toEmail)) return json({ error: "That recipient isn't an approved advisor for your account." }, 403);

    // Server-decided CC: primary advisor, always, whenever they aren't the recipient.
    const cc = (primaryEmail && toEmail !== primaryEmail) ? [primaryEmail] : undefined;

    const safeMsg = esc(message).replace(/\n/g, "<br>");
    const html =
      `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.5">` +
      `${safeMsg}` +
      `<hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0">` +
      `<div style="font-size:12px;color:#888">Sent by ${esc(clientName)} via the PCM Family Office client portal. Reply to reach ${esc(clientName)} directly${cc ? ` (${esc(primaryName || primaryEmail)} is copied)` : ""}.</div>` +
      `</div>`;

    const payload: Record<string, unknown> = {
      from: `${clientName} via PCM Family Office <${FROM.replace(/^.*<(.+)>.*$/, "$1") || FROM}>`,
      to: [toEmail],
      subject,
      html,
      text: message,
      reply_to: clientEmail || undefined,
    };
    if (cc) payload.cc = cc;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      console.error("Resend error", resp.status, detail);
      return json({ error: "The email service returned an error.", detail: detail.slice(0, 300) }, 502);
    }
    return json({ ok: true, cc: cc ? primaryEmail : null });
  } catch (e) {
    console.error("send-advisor-email error", e);
    return json({ error: "Server error." }, 500);
  }
});
