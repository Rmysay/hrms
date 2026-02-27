"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ListTodo, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Task {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    deadline: string | null;
    assignedTo: { id: string; name: string } | null;
    assignedBy: { id: string; name: string };
    createdAt: string;
    completedAt: string | null;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING: { label: "Beklemede", variant: "secondary" },
    IN_PROGRESS: { label: "Devam Ediyor", variant: "default" },
    COMPLETED: { label: "Tamamlandı", variant: "outline" },
};

const priorityMap: Record<string, { label: string; color: string }> = {
    LOW: { label: "Düşük", color: "bg-blue-100 text-blue-700" },
    MEDIUM: { label: "Orta", color: "bg-amber-100 text-amber-700" },
    HIGH: { label: "Yüksek", color: "bg-red-100 text-red-700" },
};

export default function HRTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");

    const fetchTasks = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filterStatus !== "all") params.set("status", filterStatus);
        if (filterPriority !== "all") params.set("priority", filterPriority);

        try {
            const res = await fetch(`/api/tasks?${params}`);
            const data = await res.json();
            setTasks(data.tasks || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus, filterPriority]);

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

    const handleDelete = async (taskId: string) => {
        if (!confirm("Bu görevi silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
            if (!res.ok) { toast.error("Görev silinemedi"); return; }
            toast.success("Görev silindi");
            fetchTasks();
        } catch { toast.error("Sunucu hatası"); }
    };

    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("tr-TR") : "—";

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Görevler</h1>
                    <p className="text-muted-foreground text-sm mt-1">Tüm görevleri yönetin ve takip edin</p>
                </div>
                <Link href="/hr/tasks/new">
                    <Button className="gradient-primary text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                        <Plus className="w-4 h-4 mr-2" /> Yeni Görev
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Durum" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Durumlar</SelectItem>
                                <SelectItem value="PENDING">Beklemede</SelectItem>
                                <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
                                <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Öncelik" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Öncelikler</SelectItem>
                                <SelectItem value="LOW">Düşük</SelectItem>
                                <SelectItem value="MEDIUM">Orta</SelectItem>
                                <SelectItem value="HIGH">Yüksek</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-medium text-muted-foreground">
                        {loading ? "Yükleniyor..." : `${tasks.length} görev bulundu`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <ListTodo className="w-12 h-12 mb-3 opacity-50" />
                            <p className="font-medium">Görev bulunamadı</p>
                            <p className="text-sm mt-1">Yeni bir görev oluşturarak başlayın</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Başlık</TableHead>
                                    <TableHead>Atanan Kişi</TableHead>
                                    <TableHead>Öncelik</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>Son Tarih</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.map((task) => (
                                    <TableRow key={task.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{task.title}</p>
                                                {task.description && (
                                                    <p className="text-xs text-muted-foreground truncate max-w-xs">{task.description}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{task.assignedTo?.name || <span className="text-muted-foreground">—</span>}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityMap[task.priority]?.color}`}>
                                                {priorityMap[task.priority]?.label}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Badge
                                                        variant={statusMap[task.status]?.variant}
                                                        className="cursor-pointer hover:opacity-80"
                                                    >
                                                        {statusMap[task.status]?.label}
                                                    </Badge>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {["PENDING", "IN_PROGRESS", "COMPLETED"].map((s) => (
                                                        <DropdownMenuItem
                                                            key={s}
                                                            onClick={() => handleStatusChange(task.id, s)}
                                                            disabled={task.status === s}
                                                        >
                                                            {statusMap[s]?.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                        <TableCell className="text-sm">{formatDate(task.deadline)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(task.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
