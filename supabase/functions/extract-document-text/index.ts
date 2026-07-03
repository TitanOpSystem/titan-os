// supabase/functions/extract-document-text/index.ts
// PCM Family Office — document text extraction for the AI assistant
// Transcribes a single uploaded PDF or image to plain text so the family's
// assistant can answer from document CONTENTS, not just file names.
//
// This function is a pure transcriber: it receives one file (base64) that the
// caller just uploaded and returns its text. It never queries the database or
// storage and never sees more than the one file handed to it, so it has no
// cross-family surface. The extracted text is stored by the browser on that
// document's own row and only ever reaches the assistant through that family's
// scoped snapshot.
//
// Deploy:  supabase functions deploy extract-document-text
// Secret:  reuses ANTHROPIC_API_KEY (already set)
// Optional: supabase secrets set DOC_EXTRACT_MODEL=claude-sonnet-4-6

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const MODEL = Deno.env.get("DOC_EXTRACT_MODEL") || "claude-sonnet-4-6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Hard cap on returned text so a huge document can't bloat every future prompt.
const MAX_CHARS = 12000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    if (!ANTHROPIC_API_KEY) return json({ error: "Extraction is not configured." }, 500);

    // Authenticated users only (clients may scan their own uploads).
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Not authenticated." }, 401);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) return json({ error: "Not authenticated." }, 401);

    const payload = await req.json().catch(() => null);
    const fileBase64 = payload?.fileBase64;
    const mediaType = payload?.mediaType;
    if (!fileBase64 || typeof fileBase64 !== "string") return json({ error: "Missing file." }, 400);

    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(mediaType)) {
      // Not an error — caller simply shouldn't store text for this type.
      return json({ text: "", unsupported: true });
    }
    if (fileBase64.length > 22_000_000) return json({ error: "File too large to process." }, 413);

    const docBlock = mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: fileBase64 } };

    const instruction =
      "Transcribe this document to plain text for search and question-answering. " +
      "Include all meaningful text: headings, line items, tables (as readable rows), names, dates, and amounts. " +
      "Do not summarize, interpret, or add commentary — output the document's text only. " +
      "If the document has no readable text, output nothing.";

    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: "user", content: [docBlock, { type: "text", text: instruction }] }],
      }),
    });

    if (!aiResp.ok) {
      const detail = await aiResp.text().catch(() => "");
      console.error("Anthropic error", aiResp.status, detail);
      return json({ error: "The extraction service returned an error." }, 502);
    }

    const aiData = await aiResp.json();
    let text = (aiData.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n")
      .trim();

    if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS) + "\n…[truncated]";

    return json({ text });
  } catch (e) {
    console.error("extract-document-text error", e);
    return json({ error: "Server error." }, 500);
  }
});
