import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, RefreshCw } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">

        {/* Ícone animado */}
        <div className="flex justify-center">
          <div className="relative w-28 h-28">
            {/* anel externo girando devagar */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-spin [animation-duration:8s]" />
            {/* anel médio */}
            <div className="absolute inset-3 rounded-full border-2 border-primary/30" />
            {/* centro */}
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-primary/60" />
            </div>
          </div>
        </div>

        {/* Texto */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">Erro 404</p>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Página não encontrada
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A rota{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary/80">
              {location.pathname}
            </code>{" "}
            não existe ou foi movida.
          </p>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-border/60 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="gap-2 glow-primary"
          >
            <Home className="w-4 h-4" />
            Ir para o início
          </Button>
        </div>

        {/* Rodapé sutil */}
        <p className="text-xs text-muted-foreground/40">
          Syncro CRM
        </p>
      </div>
    </div>
  );
};

export default NotFound;
