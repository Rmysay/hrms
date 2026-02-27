"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Info, AlertTriangle, ClipboardCheck, CalendarDays, ListTodo } from "lucide-react";
import { toast } from "sonner";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

const typeIcons: Record<string, React.ReactNode> = {
    INFO: <Info className="w-4 h-4 text-blue-500" />,
    WARNING: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    TEST_ASSIGNED: <ClipboardCheck className="w-4 h-4 text-indigo-500" />,
    LEAVE_STATUS: <CalendarDays className="w-4 h-4 text-emerald-500" />,
    TASK_ASSIGNED: <ListTodo className="w-4 h-4 text-purple-500" />,
};

export default function EmployeeNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            const data = await res.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications", { method: "PATCH" });
            toast.success("Tüm bildirimler okundu");
            fetchNotifications();
        } catch { toast.error("Sunucu hatası"); }
    };

    const markRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: "PATCH" });
            fetchNotifications();
        } catch { toast.error("Sunucu hatası"); }
    };

    const formatDate = (d: string) => {
        const date = new Date(d);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return "Az önce";
        if (mins < 60) return `${mins} dk önce`;
        if (hours < 24) return `${hours} saat önce`;
        if (days < 7) return `${days} gün önce`;
        return date.toLocaleDateString("tr-TR");
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Bildirimler</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Tüm bildirimler okundu"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1">
                        <CheckCheck className="w-4 h-4" /> Tümünü Oku
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
                </div>
            ) : notifications.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Bell className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                        <p className="font-medium">Bildirim bulunmamaktadır</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n, i) => (
                        <Card
                            key={n.id}
                            className={`border-0 shadow-sm transition-all animate-fade-in cursor-pointer hover:shadow-md ${!n.isRead ? "bg-primary/[0.03] border-l-4 border-l-primary" : "opacity-70"}`}
                            style={{ animationDelay: `${i * 40}ms` }}
                            onClick={() => !n.isRead && markRead(n.id)}
                        >
                            <CardContent className="py-3 flex items-start gap-3">
                                <div className="mt-0.5">
                                    {typeIcons[n.type] || <Bell className="w-4 h-4 text-muted-foreground" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                                        {!n.isRead && <Badge variant="default" className="text-[10px] px-1.5 py-0">Yeni</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                                </div>
                                {!n.isRead && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); markRead(n.id); }}>
                                        <Check className="w-3 h-3" />
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
