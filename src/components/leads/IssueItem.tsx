import { ExternalLink } from "lucide-react";

interface Issue {
    id: number;
    gh_id: number;
    title: string;
    state: string;
    url?: string;
}

export function IssueItem({ issue }: { issue: Issue }) {
    return (
        <div className="flex items-start justify-between gap-2 p-2 rounded bg-background border border-border/60">
            <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">
                    #{issue.gh_id} {issue.title}
                </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                    className={`text-xs px-1.5 py-0.5 rounded ${issue.state === "open"
                            ? "text-[hsl(var(--status-done))] bg-[hsl(var(--status-done)/0.1)]"
                            : "text-muted-foreground bg-muted/30"
                        }`}
                >
                    {issue.state}
                </span>
                {issue.url && (
                    <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
                    </a>
                )}
            </div>
        </div>
    );
}
