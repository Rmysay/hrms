"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListTodo, CalendarDays, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Task {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    deadline: string | null;
    assignedBy: { id: string; name: string };
    createdAt: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    PENDING: { label: "Beklemede", variant: "secondary" },
    IN_PROGRESS: { label: "Devam Ediyor", variant: "default" },
    COMPLETED: { label: "Tamamlandı", variant: "outline" },
};

const priorityMap: Record<string, { label: string; color: string }> = {
    LOW: { label: "Düşük", color: "border-l-blue-400" },
    MEDIUM: { label: "Orta", color: "border-l-amber-400" },
    HIGH: { label: "Yüksek", color: "border-l-red-400" },
};

export default function EmployeeTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const res = await fetch("/api/tasks");
            const data = await res.json();
            setTasks(data.tasks || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) { toast.error("Durum güncellenemedi"); return; }
            toast.success("Durum güncellendi");
            fetchTasks();
        } catch { toast.error("Sunucu hatası"); }
    };

    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("tr-TR") : null;

    const activeTasks = tasks.filter((t) => t.status !== "COMPLETED");
    const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold">Görevlerim</h1>
                <p className="text-muted-foreground text-sm mt-1">Size atanan görevleri görüntüleyin</p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
                </div>
            ) : tasks.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <ListTodo className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                        <p className="font-medium">Henüz görev atanmamış</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Active tasks */}
                    {activeTasks.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold">Aktif Görevler ({activeTasks.length})</h2>
                            {activeTasks.map((task, i) => (
                                <Card
                                    key={task.id}
                                    className={`border-0 shadow-sm border-l-4 ${priorityMap[task.priority]?.color} animate-fade-in`}
                                    style={{ animationDelay: `${i * 60}ms` }}
                                >
                                    <CardContent className="py-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium">{task.title}</h3>
                                                {task.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                    <span>Atayan: {task.assignedBy.name}</span>
                                                    {task.deadline && (
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays className="w-3 h-3" /> {formatDate(task.deadline)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Badge variant={statusMap[task.status]?.variant} className="cursor-pointer gap-1">
                                                        {statusMap[task.status]?.label}
                                                        <ChevronDown className="w-3 h-3" />
                                                    </Badge>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {["PENDING", "IN_PROGRESS", "COMPLETED"].map((s) => (
                                                        <DropdownMenuItem key={s} onClick={() => handleStatusChange(task.id, s)} disabled={task.status === s}>
                                                            {statusMap[s]?.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Completed tasks */}
                    {completedTasks.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-muted-foreground">Tamamlananlar ({completedTasks.length})</h2>
                            {completedTasks.map((task) => (
                                <Card key={task.id} className="border-0 shadow-sm opacity-60">
                                    <CardContent className="py-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium line-through">{task.title}</h3>
                                                <p className="text-xs text-muted-foreground mt-1">Atayan: {task.assignedBy.name}</p>
                                            </div>
                                            <Badge variant="outline">Tamamlandı</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
