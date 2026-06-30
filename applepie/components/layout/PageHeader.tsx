import Link from "next/link";

interface PageHeaderProps {
  title: string;
  backHref?: string;
  rightAction?: React.ReactNode;
}

export function PageHeader({ title, backHref, rightAction }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-11 px-4">
        <div className="w-10">
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center text-muted hover:text-foreground"
            >
              <span className="text-lg">←</span>
            </Link>
          )}
        </div>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        <div className="w-10 flex justify-end">{rightAction}</div>
      </div>
    </header>
  );
}
