"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

interface Employee { id: string; name: string; }

export default function NewTaskPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        deadline: "",
        assignedToId: "",
    });

    useEffect(() => {
        fetch("/api/employees").then(r => r.json()).then(d => setEmployees(d.employees || []));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    assignedToId: form.assignedToId || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) { toast.error(data.error || "Görev oluşturulamadı"); return; }

            toast.success("Görev başarıyla oluşturuldu");
            router.push("/hr/tasks");
        } catch { toast.error("Sunucu hatası"); }
        finally { setLoading(false); }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Yeni Görev Oluştur</h1>
                    <p className="text-muted-foreground text-sm mt-1">Görev bilgilerini doldurun</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Görev Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Başlık *</Label>
                            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Görev başlığı" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Açıklama</Label>
                            <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Görev detayları..." rows={4} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Öncelik</Label>
                                <Select value={form.priority} onValueChange={(val) => setForm({ ...form, priority: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Düşük</SelectItem>
                                        <SelectItem value="MEDIUM">Orta</SelectItem>
                                        <SelectItem value="HIGH">Yüksek</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deadline">Son Tarih</Label>
                                <Input id="deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label>Atanan Kişi</Label>
                                <Select value={form.assignedToId} onValueChange={(val) => setForm({ ...form, assignedToId: val })}>
                                    <SelectTrigger><SelectValue placeholder="Çalışan seçin" /></SelectTrigger>
                                    <SelectContent>
                                        {employees.map((e) => (
                                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="outline" onClick={() => router.back()}>İptal</Button>
                    <Button type="submit" disabled={loading} className="gradient-primary text-white shadow-md">
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? "Oluşturuluyor..." : "Oluştur"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
