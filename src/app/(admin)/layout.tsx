"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tv,
  Users,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionUser {
  userId: number;
  username: string;
  isAdmin: boolean;
}

const navItems = [
  { href: "/", label: "Folders", icon: Tv },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.isLoggedIn) {
          setUser(data.user);
        }
      });
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }, [router]);

  const visibleNav = navItems.filter(
    (item) => !item.adminOnly || user?.isAdmin
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-16 border-r border-border/50 bg-sidebar flex flex-col items-center py-4 gap-1 shrink-0">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl mb-4 hover:scale-110 transition-transform"
        >
          {brand.defaultEmoji}
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {visibleNav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/folders")
                : pathname.startsWith(item.href);

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="flex flex-col items-center gap-2">
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold uppercase">
                  {user.username[0]}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {user.username}
                {user.isAdmin && " (Admin)"}
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
