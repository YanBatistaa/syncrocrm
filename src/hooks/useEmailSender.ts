import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/hooks/useLeads";
import { EmailTemplate } from "@/hooks/useEmailTemplates";
import { toast } from "@/hooks/use-toast";

export function fillTemplate(template: string, lead: Lead): string {
    return template
        .replace(/\[Business Name\]/g, lead.company ?? lead.name)
        .replace(/\[Name\]/g, lead.name)
        .replace(/\[City\]/g, (lead as any).city ?? "")
        .replace(/\[LINK DA DEMO\]/g, (lead as any).demo_url ?? "")
        .replace(/\[niche\]/g, (lead as any).niche ?? "")
        .replace(/\[PREÇO\]/g, String((lead as any).price_usd ?? ""))
        .replace(/\[SEU NOME\]/g, "Yan Batista"); // substituir por useConfig depois (issue #17)
}

export function useEmailSender() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({
            lead,
            template,
        }: {
            lead: Lead;
            template: EmailTemplate;
        }) => {
            const filledSubject = fillTemplate(template.subject, lead);
            const filledBody = fillTemplate(template.body, lead);

            // 1. Envia via Edge Function
            const { error: fnError } = await supabase.functions.invoke("send-email", {
                body: { to: lead.email, subject: filledSubject, html: filledBody },
            });
            if (fnError) throw fnError;

            // 2. Salva log do envio
            const { error: logError } = await supabase.from("email_logs").insert({
                lead_id: lead.id,
                template_id: template.id,
                to_email: lead.email,
                subject_sent: filledSubject,
                body_sent: filledBody,
                status: "sent",
            });
            if (logError) throw logError;

            // 3. Atualiza email_sent_at e status do lead
            await supabase
                .from("leads")
                .update({
                    email_sent_at: new Date().toISOString(),
                    status: "email-enviado",
                })
                .eq("id", lead.id);
        },

        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["leads"] });
            qc.invalidateQueries({ queryKey: ["email_logs"] });
            toast({ title: "Email enviado com sucesso!" });
        },

        onError: (e: Error) =>
            toast({
                title: "Erro ao enviar email",
                description: e.message,
                variant: "destructive",
            }),
    });
}
