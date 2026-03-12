import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { supabase } from "@/integrations/supabase/client";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2, LogOut, Moon, Sun, Monitor,
  Eye, EyeOff, Download, Smartphone, CheckCircle2,
} from "lucide-react";
import { useTheme } from "next-themes";

// --- Schemas ---
const profileSchema = z.object({
  display_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});
const passwordSchema = z.object({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Senhas não coincidem",
  path: ["confirm"],
});
const integrationSchema = z.object({
  github_token: z.string().optional(),
});

type ProfileForm     = z.infer<typeof profileSchema>;
type PasswordForm    = z.infer<typeof passwordSchema>;
type IntegrationForm = z.infer<typeof integrationSchema>;

export default function Config() {
  const { user, signOut }            = useAuth();
  const { config, isLoading, updateConfig } = useConfig();
  const { theme, setTheme }          = useTheme();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showToken,         setShowToken]         = useState(false);
  const [isSavingPassword,  setIsSavingPassword]  = useState(false);
  const [installing,        setInstalling]        = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: "" },
  });
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const integrationForm = useForm<IntegrationForm>({
    resolver: zodResolver(integrationSchema),
    defaultValues: { github_token: "" },
  });

  useEffect(() => {
    if (config) {
      profileForm.reset({ display_name: config.display_name ?? "" });
      integrationForm.reset({ github_token: config.github_token ?? "" });
    }
  }, [config]);

  const onSaveProfile = (data: ProfileForm) =>
    updateConfig.mutate({ display_name: data.display_name });

  const onSavePassword = async (data: PasswordForm) => {
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      passwordForm.reset();
    } catch {
      toast.error("Erro ao alterar senha.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const onSaveIntegration = (data: IntegrationForm) =>
    updateConfig.mutate({ github_token: data.github_token ?? null });

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await install();
    setInstalling(false);
    if (accepted) toast.success("Syncro instalado com sucesso!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seu perfil, aparência e integrações.</p>
      </div>

      {/* PWA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Instalar aplicativo
          </CardTitle>
          <CardDescription>
            Instale o Syncro no seu celular ou desktop para acessá-lo como um app nativo, sem precisar abrir o navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isInstalled ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Syncro já está instalado</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Você está usando o app instalado.
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                <Download className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Disponível para instalação</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Funciona no Chrome, Edge e Android.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleInstall}
                  disabled={installing}
                  className="gap-1.5 flex-shrink-0"
                >
                  {installing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Instalar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Siga as instruções abaixo para instalar no seu dispositivo:
              </p>
              <div className="space-y-2">
                {[
                  { icon: "📱", label: "Android (Chrome)", desc: "Menu (⋮) → Adicionar à tela inicial" },
                  { icon: "💜", label: "iPhone (Safari)",  desc: "Compartilhar (⧇) → Adicionar à Tela de Início" },
                  { icon: "🖥️", label: "Desktop (Chrome/Edge)", desc: "Clique no ícone de instalar na barra de endereço" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 p-2.5 rounded-lg border border-border/40 bg-muted/20"
                  >
                    <span className="text-base mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PERFIL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">👤 Perfil</CardTitle>
          <CardDescription>Seu nome de exibição e e-mail da conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label>E-mail</Label>
            <Input value={user?.email ?? ""} disabled className="bg-muted" />
            <span className="text-xs text-muted-foreground">Não é possível alterar o e-mail.</span>
          </div>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="display_name">Nome de exibição</Label>
              <Input id="display_name" placeholder="Yan Batista" {...profileForm.register("display_name")} />
              {profileForm.formState.errors.display_name && (
                <span className="text-xs text-destructive">{profileForm.formState.errors.display_name.message}</span>
              )}
            </div>
            <Button type="submit" className="w-fit" disabled={updateConfig.isPending}>
              {updateConfig.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Salvar perfil"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* SENHA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🔒 Segurança</CardTitle>
          <CardDescription>Altere sua senha de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onSavePassword)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" type="password" placeholder="········" {...passwordForm.register("password")} />
              {passwordForm.formState.errors.password && (
                <span className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm">Confirmar nova senha</Label>
              <Input id="confirm" type="password" placeholder="········" {...passwordForm.register("confirm")} />
              {passwordForm.formState.errors.confirm && (
                <span className="text-xs text-destructive">{passwordForm.formState.errors.confirm.message}</span>
              )}
            </div>
            <Button type="submit" className="w-fit" disabled={isSavingPassword}>
              {isSavingPassword ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Alterar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* APARÊNCIA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🎨 Aparência</CardTitle>
          <CardDescription>Escolha o tema da interface.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[
              { value: "light",  label: "Claro",   icon: Sun },
              { value: "dark",   label: "Escuro",   icon: Moon },
              { value: "system", label: "Sistema",  icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  theme === value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* INTEGRAÇÕES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🔗 Integrações</CardTitle>
          <CardDescription>Token do GitHub para acessar repositórios privados.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={integrationForm.handleSubmit(onSaveIntegration)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="github_token">GitHub Personal Access Token</Label>
              <div className="relative">
                <Input
                  id="github_token"
                  type={showToken ? "text" : "password"}
                  placeholder="ghp_xxxxxxxxxxxx"
                  {...integrationForm.register("github_token")}
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-xs text-muted-foreground">
                Opcional. Necessário apenas para sincronizar issues de repositórios privados.
              </span>
            </div>
            <Button type="submit" className="w-fit" disabled={updateConfig.isPending}>
              {updateConfig.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Salvar token"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* CONTA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🗄️ Conta</CardTitle>
          <CardDescription>Ações da sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <Button variant="destructive" onClick={signOut} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
