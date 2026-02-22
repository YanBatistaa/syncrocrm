import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function sendDiscord(webhookUrl: string, content: string) {
    await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });
}

function fillTemplate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function alreadyFiredToday(lastFiredAt: string | null): boolean {
    if (!lastFiredAt) return false;
    const last = new Date(lastFiredAt);
    const now = new Date();
    return (
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate()
    );
}

Deno.serve(async () => {
    const { data: automations } = await supabase
        .from("automations")
        .select("*")
        .eq("active", true);

    if (!automations?.length) return new Response("no automations", { status: 200 });

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    for (const auto of automations) {
        try {
            // ── deadline_approaching ──────────────────────────────────────────────
            if (auto.trigger_type === "deadline_approaching") {
                const { data: leads } = await supabase
                    .from("leads")
                    .select("*")
                    .neq("status", "done")
                    .not("deadline", "is", null);

                for (const lead of leads ?? []) {
                    const daysLeft = Math.ceil(
                        (new Date(lead.deadline).getTime() - now.getTime()) / 86400000
                    );
                    if (daysLeft !== 1) continue;

                    const { data: existing } = await supabase
                        .from("automation_logs")
                        .select("id")
                        .eq("automation_id", auto.id)
                        .gte("fired_at", `${todayStr}T00:00:00`)
                        .eq("payload->>lead_id", String(lead.id))
                        .maybeSingle();

                    if (existing) continue;

                    const message = fillTemplate(auto.message_template, {
                        "lead.name": lead.name ?? "",
                        "lead.company": lead.company ?? "—",
                        "lead.deadline": new Date(lead.deadline).toLocaleDateString("pt-BR"),
                    });

                    await sendDiscord(auto.webhook_url, message);
                    await supabase.from("automation_logs").insert({
                        automation_id: auto.id,
                        payload: { lead_id: lead.id },
                    });
                }

                await supabase
                    .from("automations")
                    .update({ last_fired_at: now.toISOString() })
                    .eq("id", auto.id);
            }

            // ── no_progress ───────────────────────────────────────────────────────
            if (auto.trigger_type === "no_progress") {
                if (alreadyFiredToday(auto.last_fired_at)) continue;
                const staleDays = auto.trigger_value?.days ?? 7;

                const { data: projetos } = await supabase
                    .from("projetos_pessoais")
                    .select("*")
                    .neq("status", "done")
                    .lt(
                        "updated_at",
                        new Date(now.getTime() - staleDays * 86400000).toISOString()
                    );

                for (const projeto of projetos ?? []) {
                    const message = fillTemplate(auto.message_template, {
                        "projeto.name": projeto.name ?? "",
                        "projeto.progress": String(projeto.progress ?? 0),
                        "projeto.updated_at": new Date(projeto.updated_at).toLocaleDateString("pt-BR"),
                    });
                    await sendDiscord(auto.webhook_url, message);
                }

                await supabase
                    .from("automations")
                    .update({ last_fired_at: now.toISOString() })
                    .eq("id", auto.id);
            }

            // ── end_of_day ────────────────────────────────────────────────────────
            if (auto.trigger_type === "end_of_day") {
                const currentHour = now.getUTCHours() - 3; // UTC-3
                if (currentHour !== 18) continue;
                if (alreadyFiredToday(auto.last_fired_at)) continue;

                const { count: leadsActive } = await supabase
                    .from("leads")
                    .select("*", { count: "exact", head: true })
                    .neq("status", "done");

                const { count: projetosDev } = await supabase
                    .from("projetos_pessoais")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "dev");

                const { count: tasksDone } = await supabase
                    .from("daily_tasks")
                    .select("*", { count: "exact", head: true })
                    .eq("done", true)
                    .eq("scheduled_date", todayStr);

                const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString();
                const { count: deadlinesWeek } = await supabase
                    .from("leads")
                    .select("*", { count: "exact", head: true })
                    .neq("status", "done")
                    .not("deadline", "is", null)
                    .lte("deadline", nextWeek);

                const message = fillTemplate(auto.message_template, {
                    "stats.leads_active": String(leadsActive ?? 0),
                    "stats.projetos_dev": String(projetosDev ?? 0),
                    "stats.tasks_done": String(tasksDone ?? 0),
                    "stats.deadlines_week": String(deadlinesWeek ?? 0),
                });

                await sendDiscord(auto.webhook_url, message);
                await supabase
                    .from("automations")
                    .update({ last_fired_at: now.toISOString() })
                    .eq("id", auto.id);
            }
        } catch (err) {
            await supabase.from("automation_logs").insert({
                automation_id: auto.id,
                success: false,
                payload: { error: String(err) },
            });
        }
    }

    return new Response("ok", { status: 200 });
});
