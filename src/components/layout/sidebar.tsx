"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Building2,
    Network,
    ClipboardCheck,
    ListTodo,
    CalendarDays,
    Bell,
    Grid3X3,
    Sparkles,
    Settings,
    LogOut,
    ChevronLeft,
    Menu,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: number;
}

const hrNavItems: NavItem[] = [
    { label: "Dashboard", href: "/hr/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Çalışanlar", href: "/hr/employees", icon: <Users className="w-5 h-5" /> },
    { label: "Departmanlar", href: "/hr/departments", icon: <Building2 className="w-5 h-5" /> },
    { label: "Org. Şeması", href: "/hr/org-chart", icon: <Network className="w-5 h-5" /> },
    { label: "Testler", href: "/hr/tests", icon: <ClipboardCheck className="w-5 h-5" /> },
    { label: "Görevler", href: "/hr/tasks", icon: <ListTodo className="w-5 h-5" /> },
    { label: "İzin Talepleri", href: "/hr/leaves", icon: <CalendarDays className="w-5 h-5" /> },
    { label: "9-Box Grid", href: "/hr/nine-box", icon: <Grid3X3 className="w-5 h-5" /> },
    { label: "AI Tavsiyeleri", href: "/hr/ai-insights", icon: <Sparkles className="w-5 h-5" /> },
    { label: "Bildirimler", href: "/hr/notifications", icon: <Bell className="w-5 h-5" /> },
    { label: "Ayarlar", href: "/hr/settings", icon: <Settings className="w-5 h-5" /> },
];

const employeeNavItems: NavItem[] = [
    { label: "Dashboard", href: "/employee/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Testlerim", href: "/employee/tests", icon: <ClipboardCheck className="w-5 h-5" /> },
    { label: "Görevlerim", href: "/employee/tasks", icon: <ListTodo className="w-5 h-5" /> },
    { label: "İzin Taleplerim", href: "/employee/leaves", icon: <CalendarDays className="w-5 h-5" /> },
    { label: "Org. Şeması", href: "/employee/org-chart", icon: <Network className="w-5 h-5" /> },
    { label: "Bildirimler", href: "/employee/notifications", icon: <Bell className="w-5 h-5" /> },
];

interface SidebarProps {
    role: "HR" | "EMPLOYEE" | "SUPER_ADMIN";
    userName: string;
    tenantName: string;
}

export function Sidebar({ role, userName, tenantName }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);

    const navItems = role === "EMPLOYEE" ? employeeNavItems : hrNavItems;

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-screen flex flex-col transition-sidebar z-50",
                "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
                collapsed ? "w-[72px]" : "w-[260px]"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
                {!collapsed && (
                    <div className="flex items-center gap-3 animate-fade-in">
                        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-bold text-sm text-sidebar-foreground">HRMS</h1>
                            <p className="text-xs text-sidebar-foreground/60 truncate max-w-[140px]">{tenantName}</p>
                        </div>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
                >
                    {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                    const linkContent = (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <span className={cn(isActive && "drop-shadow-sm")}>{item.icon}</span>
                            {!collapsed && <span className="animate-fade-in">{item.label}</span>}
                            {!collapsed && item.badge && item.badge > 0 && (
                                <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );

                    if (collapsed) {
                        return (
                            <Tooltip key={item.href} delayDuration={0}>
                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                <TooltipContent side="right" className="font-medium">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    }

                    return linkContent;
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-sidebar-border p-3 space-y-2">
                {!collapsed && (
                    <div className="px-3 py-2 animate-fade-in">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
                        <p className="text-xs text-sidebar-foreground/50">
                            {role === "HR" ? "İK Yöneticisi" : role === "SUPER_ADMIN" ? "Süper Admin" : "Çalışan"}
                        </p>
                    </div>
                )}
                <Separator className="bg-sidebar-border" />
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <button
                            onClick={handleLogout}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200",
                                "text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <LogOut className="w-5 h-5" />
                            {!collapsed && <span>Çıkış Yap</span>}
                        </button>
                    </TooltipTrigger>
                    {collapsed && (
                        <TooltipContent side="right">Çıkış Yap</TooltipContent>
                    )}
                </Tooltip>
            </div>
        </aside>
    );
}
