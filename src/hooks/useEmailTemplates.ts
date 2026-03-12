import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailTemplate {
    id: string;
    name: string;
    type: string;
    subject: string;
    body: string;
    is_active: boolean;
}

export function useEmailTemplates() {
    return useQuery({
        queryKey: ["email_templates"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("email_templates")
                .select("*")
                .eq("is_active", true)
                .order("name");
            if (error) throw error;
            return data as EmailTemplate[];
        },
    });
}
