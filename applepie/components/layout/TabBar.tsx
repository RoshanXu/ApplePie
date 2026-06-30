"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/home", label: "首页", icon: "🏠" },
  { href: "/schedule", label: "时间", icon: "📅" },
  { href: "/game", label: "游戏", icon: "🎮" },
  { href: "/profile", label: "我的", icon: "👤" },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-surface border-t border-border z-50">
      <div className="flex justify-around items-center h-14 px-2 pb-safe">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full ${
                isActive ? "text-brand" : "text-muted"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
