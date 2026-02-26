import { useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function PWAInstallBanner() {
  const { showBanner, install, dismissBanner } = usePWAInstall();
  const [dontShow, setDontShow] = useState(false);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-card border border-border/60 rounded-xl shadow-2xl p-4 space-y-3 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Instalar Syncro</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Acesse pelo celular ou desktop como um app nativo
              </p>
            </div>
          </div>
          <button
            onClick={() => dismissBanner(dontShow)}
            className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={async () => {
              await install();
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Instalar agora
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-border/60"
            onClick={() => dismissBanner(dontShow)}
          >
            Agora não
          </Button>
        </div>

        {/* Não mostrar novamente */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="dont-show"
            checked={dontShow}
            onCheckedChange={(v) => setDontShow(v === true)}
            className="w-3.5 h-3.5"
          />
          <label
            htmlFor="dont-show"
            className="text-xs text-muted-foreground cursor-pointer select-none"
          >
            Não me mostrar isso novamente
          </label>
        </div>
      </div>
    </div>
  );
}
