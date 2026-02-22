import { useRef, useState } from "react";
import { Paperclip, Upload, Trash2, Download, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDealFiles,
  useUploadDealFile,
  useDeleteDealFile,
  useGetDealFileUrl,
  formatBytes,
  fileIcon,
} from "@/hooks/useDealFiles";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const ACCEPTED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
];

const MAX_MB = 10;

export function DealFilesSection({ dealId }: { dealId: number }) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const { data: files = [], isLoading } = useDealFiles(dealId);
  const upload     = useUploadDealFile();
  const remove     = useDeleteDealFile();
  const getUrl     = useGetDealFileUrl();
  const [downloading, setDownloading] = useState<number | null>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const file = fileList[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({ title: `Arquivo muito grande (máx ${MAX_MB} MB)`, variant: "destructive" });
      return;
    }
    upload.mutate({ dealId, file });
  };

  const handleDownload = async (id: number, path: string, name: string) => {
    setDownloading(id);
    try {
      const url = await getUrl(path, true);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      toast({ title: "Erro ao baixar", description: msg, variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Paperclip className="w-3.5 h-3.5" />
          Arquivos
          {files.length > 0 && (
            <span className="bg-muted/40 px-1.5 py-0.5 rounded text-muted-foreground">{files.length}</span>
          )}
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-border/60 gap-1.5"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          {upload.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Upload className="w-3 h-3" />
          )}
          Enviar arquivo
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
        />
      </div>

      {/* Drop zone (aparece quando não há arquivos) */}
      {files.length === 0 && !isLoading && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-primary/60 bg-primary/5"
              : "border-border/40 hover:border-border/70 hover:bg-muted/20"
          }`}
        >
          <FileText className="w-8 h-8 text-muted-foreground/25 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            {dragging ? "Solte para enviar" : "Arraste ou clique para enviar"}
          </p>
          <p className="text-xs text-muted-foreground/50 mt-0.5">
            PDF, DOCX, TXT, XLSX, PNG... até {MAX_MB} MB
          </p>
        </div>
      )}

      {/* Lista de arquivos */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-background group hover:border-border transition-colors"
            >
              {/* Ícone do tipo */}
              <span className="text-lg flex-shrink-0 select-none w-6 text-center">
                {fileIcon(file.mime_type)}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground/60">
                  {formatBytes(file.size)}
                  <span className="mx-1">·</span>
                  {format(parseISO(file.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                </p>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                  disabled={downloading === file.id}
                  onClick={() => handleDownload(file.id, file.storage_path, file.name)}
                  title="Baixar"
                >
                  {downloading === file.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    remove.mutate({ id: file.id, dealId: file.deal_id, storagePath: file.storage_path })
                  }
                  title="Remover"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          {/* Botão de adicionar mais quando já existem arquivos */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex items-center justify-center gap-1.5 rounded-lg border border-dashed p-2 cursor-pointer transition-colors ${
              dragging
                ? "border-primary/60 bg-primary/5"
                : "border-border/30 hover:border-border/60 hover:bg-muted/10"
            }`}
          >
            <Upload className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground/50">
              {dragging ? "Solte aqui" : "Adicionar outro arquivo"}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
