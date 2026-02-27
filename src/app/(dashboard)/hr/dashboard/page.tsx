"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Users, Building2, CalendarDays, ListTodo, ClipboardCheck,
    Bell, Grid3X3, TrendingUp, ArrowRight, CheckCircle, Clock
} from "lucide-react";

interface Stats {
    totalEmployees: number;
    activeEmployees: number;
    departments: number;
    pendingLeaves: number;
    approvedLeaves: number;
    rejectedLeaves: number;
    activeTasks: number;
    completedTasks: number;
    totalTasks: number;
    activeTests: number;
    testResults: number;
    unreadNotifications: number;
    nineBoxCount: number;
    recentLeaves: { id: string; leaveType: string; status: string; startDate: string; endDate: string; user: { name: string } }[];
    recentTasks: { id: string; title: string; status: string; priority: string; assignedTo: { name: string } | null }[];
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    PENDING: { label: "Beklemede", variant: "secondary" },
    APPROVED: { label: "Onaylandı", variant: "default" },
    REJECTED: { label: "Reddedildi", variant: "destructive" },
    IN_PROGRESS: { label: "Devam", variant: "default" },
    COMPLETED: { label: "Tamamlandı", variant: "default" },
};

const priorityColors: Record<string, string> = {
    LOW: "bg-blue-100 text-blue-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    HIGH: "bg-red-100 text-red-700",
};

const leaveTypeMap: Record<string, string> = {
    ANNUAL: "Yıllık", EXCUSE: "Mazeret", UNPAID: "Ücretsiz",
};

export default function HRDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/dashboard/stats")
            .then((r) => r.json())
            .then((d) => setStats(d))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const taskCompletionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome */}
            <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 text-white shadow-lg">
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold">Hoş Geldiniz! 👋</h1>
                    <p className="text-white/80 mt-1">İK Yönetim Paneli — Bugünkü genel bakış</p>
                </div>
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -right-2 -bottom-8 w-24 h-24 bg-white/5 rounded-full blur-xl" />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Çalışanlar", value: stats.activeEmployees, total: stats.totalEmployees, icon: <Users className="w-5 h-5" />, color: "from-blue-500 to-indigo-500", href: "/hr/employees" },
                    { label: "Departmanlar", value: stats.departments, icon: <Building2 className="w-5 h-5" />, color: "from-emerald-500 to-teal-500", href: "/hr/departments" },
                    { label: "Bekleyen İzinler", value: stats.pendingLeaves, icon: <CalendarDays className="w-5 h-5" />, color: "from-amber-500 to-orange-500", href: "/hr/leaves", alert: stats.pendingLeaves > 0 },
                    { label: "Aktif Görevler", value: stats.activeTasks, icon: <ListTodo className="w-5 h-5" />, color: "from-purple-500 to-pink-500", href: "/hr/tasks" },
                    { label: "Aktif Testler", value: stats.activeTests, icon: <ClipboardCheck className="w-5 h-5" />, color: "from-cyan-500 to-blue-500", href: "/hr/tests" },
                    { label: "Test Sonuçları", value: stats.testResults, icon: <TrendingUp className="w-5 h-5" />, color: "from-rose-500 to-red-500", href: "/hr/tests" },
                    { label: "9-Box Değerlendirme", value: stats.nineBoxCount, icon: <Grid3X3 className="w-5 h-5" />, color: "from-violet-500 to-purple-500", href: "/hr/nine-box" },
                    { label: "Bildirimler", value: stats.unreadNotifications, icon: <Bell className="w-5 h-5" />, color: "from-slate-500 to-gray-500", href: "/hr/notifications", alert: stats.unreadNotifications > 0 },
                ].map((card, i) => (
                    <Link key={card.label} href={card.href}>
                        <Card
                            className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group animate-fade-in relative overflow-hidden"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <CardContent className="pt-5 pb-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                                        <p className="text-3xl font-bold mt-1">{card.value}</p>
                                        {card.total && <p className="text-xs text-muted-foreground mt-0.5">/ {card.total} toplam</p>}
                                    </div>
                                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                                        {card.icon}
                                    </div>
                                </div>
                                {card.alert && (
                                    <div className="absolute top-2 right-2">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Task completion progress */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        Görev Tamamlanma Oranı
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="w-full bg-muted rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-emerald-500 to-green-400 h-3 rounded-full transition-all duration-1000"
                                    style={{ width: `${taskCompletionRate}%` }}
                                />
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-emerald-600">%{taskCompletionRate}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        {stats.completedTasks} / {stats.totalTasks} görev tamamlandı
                    </p>
                </CardContent>
            </Card>

            {/* Leave overview mini chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">İzin Durumu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { label: "Beklemede", value: stats.pendingLeaves, color: "bg-amber-500" },
                                { label: "Onaylanan", value: stats.approvedLeaves, color: "bg-emerald-500" },
                                { label: "Reddedilen", value: stats.rejectedLeaves, color: "bg-red-500" },
                            ].map((item) => {
                                const total = stats.pendingLeaves + stats.approvedLeaves + stats.rejectedLeaves;
                                const pct = total > 0 ? (item.value / total) * 100 : 0;
                                return (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                        <span className="text-sm flex-1">{item.label}</span>
                                        <span className="text-sm font-medium">{item.value}</span>
                                        <div className="w-16 bg-muted rounded-full h-1.5">
                                            <div className={`${item.color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent leaves */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Son İzin Talepleri</CardTitle>
                        <Link href="/hr/leaves"><Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Tümü <ArrowRight className="w-3 h-3" /></Button></Link>
                    </CardHeader>
                    <CardContent>
                        {stats.recentLeaves.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Talep yok</p>
                        ) : (
                            <div className="space-y-2">
                                {stats.recentLeaves.map((l) => (
                                    <div key={l.id} className="flex items-center justify-between text-sm">
                                        <div className="truncate flex-1">
                                            <p className="font-medium truncate">{l.user.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{leaveTypeMap[l.leaveType]}</p>
                                        </div>
                                        <Badge variant={statusMap[l.status]?.variant} className="text-[10px]">
                                            {statusMap[l.status]?.label}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent tasks */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Son Görevler</CardTitle>
                        <Link href="/hr/tasks"><Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Tümü <ArrowRight className="w-3 h-3" /></Button></Link>
                    </CardHeader>
                    <CardContent>
                        {stats.recentTasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Görev yok</p>
                        ) : (
                            <div className="space-y-2">
                                {stats.recentTasks.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between text-sm">
                                        <div className="truncate flex-1">
                                            <p className="font-medium truncate">{t.title}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {t.assignedTo && <p className="text-[10px] text-muted-foreground">{t.assignedTo.name}</p>}
                                                <span className={`text-[10px] px-1.5 py-0 rounded ${priorityColors[t.priority]}`}>{t.priority === "HIGH" ? "!" : ""}</span>
                                            </div>
                                        </div>
                                        <Badge variant={statusMap[t.status]?.variant} className="text-[10px]">
                                            {t.status === "IN_PROGRESS" ? <Clock className="w-2.5 h-2.5 mr-0.5" /> : null}
                                            {statusMap[t.status]?.label}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick actions */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Hızlı İşlemler</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: "Çalışan Ekle", href: "/hr/employees/new" },
                            { label: "Görev Oluştur", href: "/hr/tasks/new" },
                            { label: "Test Oluştur", href: "/hr/tests/new" },
                            { label: "9-Box Değerlendir", href: "/hr/nine-box" },
                        ].map((action) => (
                            <Link key={action.href} href={action.href}>
                                <Button variant="outline" size="sm" className="hover:bg-primary/5 transition-colors">
                                    {action.label}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
