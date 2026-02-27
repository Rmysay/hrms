"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ListTodo, CalendarDays, ClipboardCheck, Bell, ArrowRight, CheckCircle, Clock
} from "lucide-react";

interface Stats {
    pendingLeaves: number;
    approvedLeaves: number;
    activeTasks: number;
    completedTasks: number;
    totalTasks: number;
    activeTests: number;
    testResults: number;
    unreadNotifications: number;
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

const leaveTypeMap: Record<string, string> = {
    ANNUAL: "Yıllık", EXCUSE: "Mazeret", UNPAID: "Ücretsiz",
};

export default function EmployeeDashboard() {
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
                <div className="h-28 bg-muted animate-pulse rounded-2xl" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
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
                    <p className="text-white/80 mt-1">Bugünkü durumunuz aşağıda</p>
                </div>
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Aktif Görevler", value: stats.activeTasks, icon: <ListTodo className="w-5 h-5" />, color: "from-purple-500 to-pink-500", href: "/employee/tasks" },
                    { label: "Bekleyen İzinler", value: stats.pendingLeaves, icon: <CalendarDays className="w-5 h-5" />, color: "from-amber-500 to-orange-500", href: "/employee/leaves" },
                    { label: "Test Sonuçları", value: stats.testResults, icon: <ClipboardCheck className="w-5 h-5" />, color: "from-cyan-500 to-blue-500", href: "/employee/tests" },
                    { label: "Bildirimler", value: stats.unreadNotifications, icon: <Bell className="w-5 h-5" />, color: "from-slate-500 to-gray-500", href: "/employee/notifications", alert: stats.unreadNotifications > 0 },
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

            {/* Task progress */}
            {stats.totalTasks > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            Görev İlerlemeniz
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
            )}

            {/* Recent tasks + leaves */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Son Görevler</CardTitle>
                        <Link href="/employee/tasks"><Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Tümü <ArrowRight className="w-3 h-3" /></Button></Link>
                    </CardHeader>
                    <CardContent>
                        {stats.recentTasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">Henüz görev yok</p>
                        ) : (
                            <div className="space-y-2">
                                {stats.recentTasks.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between text-sm">
                                        <p className="font-medium truncate flex-1">{t.title}</p>
                                        <Badge variant={statusMap[t.status]?.variant} className="text-[10px] ml-2">
                                            {t.status === "IN_PROGRESS" ? <Clock className="w-2.5 h-2.5 mr-0.5" /> : null}
                                            {statusMap[t.status]?.label}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">İzin Taleplerim</CardTitle>
                        <Link href="/employee/leaves"><Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Tümü <ArrowRight className="w-3 h-3" /></Button></Link>
                    </CardHeader>
                    <CardContent>
                        {stats.recentLeaves.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">Henüz izin talebi yok</p>
                        ) : (
                            <div className="space-y-2">
                                {stats.recentLeaves.map((l) => (
                                    <div key={l.id} className="flex items-center justify-between text-sm">
                                        <p className="font-medium">{leaveTypeMap[l.leaveType]}</p>
                                        <Badge variant={statusMap[l.status]?.variant} className="text-[10px]">
                                            {statusMap[l.status]?.label}
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
                        <Link href="/employee/tasks"><Button variant="outline" size="sm">Görevlerime Git</Button></Link>
                        <Link href="/employee/leaves"><Button variant="outline" size="sm">İzin Talep Et</Button></Link>
                        <Link href="/employee/tests"><Button variant="outline" size="sm">Testlerimi Gör</Button></Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
