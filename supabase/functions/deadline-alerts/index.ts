// Supabase Edge Function: deadline-alerts
// Deploy with: supabase functions deploy deadline-alerts
// Schedule via Supabase Dashboard > Edge Functions > Schedules: 0 8 * * *  (runs daily at 8am)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FROM_EMAIL = "info@pcmfamilyoffice.com";

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async () => {
  const today = new Date();
  const alertDate = new Date();
  alertDate.setDate(today.getDate() + 30);
  const alertDateStr = alertDate.toISOString().split("T")[0];

  // Find all incomplete tasks due in exactly 30 days that have a family with an advisor email
  const { data: tasks, error } = await sb
    .from("tasks")
    .select(`
      id, title, due_date, priority,
      families ( id, name, advisor_name, advisor_email )
    `)
    .eq("done", false)
    .eq("due_date", alertDateStr)
    .not("family_id", "is", null);

  if (error) {
    console.error("Error fetching tasks:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results = [];

  for (const task of tasks) {
    const family = task.families;
    if (!family?.advisor_email) continue;

    // Check if we already sent this alert
    const { data: existing } = await sb
      .from("advisor_alert_log")
      .select("id")
      .eq("task_id", task.id)
      .eq("advisor_email", family.advisor_email)
      .single();

    if (existing) {
      results.push({ task: task.title, status: "already_sent" });
      continue;
    }

    // Send email via Supabase Auth email (uses your SMTP settings)
    const emailBody = `
Dear ${family.advisor_name || "Advisor"},

This is an automated reminder from PCM Family Office.

A deadline is approaching in 30 days for one of your client families:

Family:   ${family.name}
Task:     ${task.title}
Priority: ${task.priority}
Due Date: ${new Date(task.due_date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

Please log in to the PCM Family Office platform to review and take action.

—
PCM Family Office
DISCOVER · SIMPLIFY · EXECUTE
info@pcmfamilyoffice.com
    `.trim();

    const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        to: family.advisor_email,
        from: FROM_EMAIL,
        subject: `[PCM] 30-Day Deadline Reminder — ${family.name}: ${task.title}`,
        text: emailBody,
      }),
    });

    // Log the alert so we don't send it again
    await sb.from("advisor_alert_log").insert({
      task_id: task.id,
      family_id: family.id,
      advisor_email: family.advisor_email,
    });

    results.push({ task: task.title, family: family.name, status: "sent", to: family.advisor_email });
  }

  console.log("Alert results:", results);
  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
