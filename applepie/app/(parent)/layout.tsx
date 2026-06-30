import Link from "next/link";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-11 px-4">
          <h1 className="text-base font-semibold text-foreground">ApplePie 家长</h1>
          <Link href="/home" className="text-xs text-brand font-medium">
            切换学生视角
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
