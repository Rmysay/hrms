"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TooltipProvider } from "@/components/ui/tooltip";

interface UserData {
    id: string;
    name: string;
    email: string;
    role: "HR" | "EMPLOYEE" | "SUPER_ADMIN";
    tenantId: string;
    tenant: { id: string; name: string; slug: string; logoUrl: string | null };
    department: { id: string; name: string } | null;
    position: { id: string; name: string } | null;
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (!res.ok || !data.user) {
                    router.push("/login");
                    return;
                }
                setUser(data.user);
            } catch {
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg animate-pulse-soft">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <p className="text-muted-foreground text-sm animate-pulse-soft">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background">
                <Sidebar
                    role={user.role}
                    userName={user.name}
                    tenantName={user.tenant.name}
                />
                <div className="pl-[260px] transition-sidebar">
                    <Header
                        userName={user.name}
                        userRole={user.role}
                        tenantName={user.tenant.name}
                    />
                    <main className="p-6">
                        {children}
                    </main>
                </div>
            </div>
        </TooltipProvider>
    );
}
