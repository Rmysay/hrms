"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Building2, Users, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Department {
    id: string;
    name: string;
    manager: { id: string; name: string } | null;
    _count: { members: number; positions: number };
}

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [editName, setEditName] = useState("");

    const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/departments");
            const data = await res.json();
            setDepartments(data.departments || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            const res = await fetch("/api/departments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error);
                return;
            }
            toast.success("Departman oluşturuldu");
            setNewName("");
            setDialogOpen(false);
            fetchDepartments();
        } catch {
            toast.error("Sunucu hatası");
        }
    };

    const handleUpdate = async () => {
        if (!editingDept || !editName.trim()) return;
        try {
            const res = await fetch(`/api/departments/${editingDept.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName }),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error);
                return;
            }
            toast.success("Departman güncellendi");
            setEditingDept(null);
            fetchDepartments();
        } catch {
            toast.error("Sunucu hatası");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu departmanı silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error);
                return;
            }
            toast.success("Departman silindi");
            fetchDepartments();
        } catch {
            toast.error("Sunucu hatası");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Departmanlar</h1>
                    <p className="text-muted-foreground text-sm mt-1">Departmanlarınızı yönetin</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-primary text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                            <Plus className="w-4 h-4 mr-2" />
                            Yeni Departman
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Departman Oluştur</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Departman Adı</Label>
                                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Departman adı" />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                                <Button onClick={handleCreate} className="gradient-primary text-white">Oluştur</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit dialog */}
            <Dialog open={!!editingDept} onOpenChange={(open) => !open && setEditingDept(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Departman Düzenle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Departman Adı</Label>
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingDept(null)}>İptal</Button>
                            <Button onClick={handleUpdate} className="gradient-primary text-white">Güncelle</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : departments.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Building2 className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                        <p className="font-medium">Departman bulunamadı</p>
                        <p className="text-sm text-muted-foreground mt-1">Yeni bir departman ekleyerek başlayın</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {departments.map((dept, i) => (
                        <Card
                            key={dept.id}
                            className="border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group animate-fade-in"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Building2 className="w-5 h-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingDept(dept); setEditName(dept.name); }}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(dept.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4" />
                                        <span>{dept._count.members} çalışan</span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {dept._count.positions} pozisyon
                                    </Badge>
                                </div>
                                {dept.manager && (
                                    <p className="text-sm mt-3 text-muted-foreground">
                                        Yönetici: <span className="font-medium text-foreground">{dept.manager.name}</span>
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
