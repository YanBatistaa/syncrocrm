import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function fillTemplate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

Deno.serve(async (req) => {
    const body = await req.json();
    const lead = body.record;
    if (!lead) return new Response("no record", { status: 400 });

    const { data: automations } = await supabase
        .from("automations")
        .select("*")
        .eq("trigger_type", "new_lead")
        .eq("active", true);

    for (const auto of automations ?? []) {
        const message = fillTemplate(auto.message_template, {
            "lead.name": lead.name ?? "",
            "lead.company": lead.company ?? "—",
            "lead.status": lead.status ?? "",
        });

        await fetch(auto.webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: message }),
        });

        await supabase.from("automation_logs").insert({
            automation_id: auto.id,
            payload: { lead_id: lead.id },
        });

        await supabase
            .from("automations")
            .update({ last_fired_at: new Date().toISOString() })
            .eq("id", auto.id);
    }

    return new Response("ok", { status: 200 });
});
