import { TabBar } from "@/components/layout/TabBar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-14">
      {children}
      <TabBar />
    </div>
  );
}
