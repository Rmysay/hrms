"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

interface Department { id: string; name: string; }
interface Position { id: string; name: string; }
interface Employee { id: string; name: string; }

export default function NewEmployeePage() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [managers, setManagers] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        birthDate: "",
        startDate: "",
        departmentId: "",
        positionId: "",
        managerId: "",
        role: "EMPLOYEE",
        annualLeaveDays: 14,
    });

    useEffect(() => {
        const fetchData = async () => {
            const [deptRes, posRes, empRes] = await Promise.all([
                fetch("/api/departments"),
                fetch("/api/positions"),
                fetch("/api/employees"),
            ]);
            const [deptData, posData, empData] = await Promise.all([
                deptRes.json(),
                posRes.json(),
                empRes.json(),
            ]);
            setDepartments(deptData.departments || []);
            setPositions(posData.positions || []);
            setManagers(empData.employees || []);
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    departmentId: form.departmentId || null,
                    positionId: form.positionId || null,
                    managerId: form.managerId || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Çalışan eklenemedi");
                return;
            }

            toast.success("Çalışan başarıyla eklendi");
            router.push("/hr/employees");
        } catch {
            toast.error("Sunucu hatası");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Yeni Çalışan Ekle</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Çalışan bilgilerini doldurun
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Kişisel Bilgiler</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Ad Soyad *</Label>
                                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta *</Label>
                                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Şifre *</Label>
                                <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon</Label>
                                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Doğum Tarihi</Label>
                                <Input id="birthDate" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                                <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm mt-4">
                    <CardHeader>
                        <CardTitle className="text-lg">Pozisyon Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Departman</Label>
                                <Select value={form.departmentId} onValueChange={(val) => setForm({ ...form, departmentId: val })}>
                                    <SelectTrigger><SelectValue placeholder="Departman seçin" /></SelectTrigger>
                                    <SelectContent>
                                        {departments.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Pozisyon</Label>
                                <Select value={form.positionId} onValueChange={(val) => setForm({ ...form, positionId: val })}>
                                    <SelectTrigger><SelectValue placeholder="Pozisyon seçin" /></SelectTrigger>
                                    <SelectContent>
                                        {positions.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Yönetici</Label>
                                <Select value={form.managerId} onValueChange={(val) => setForm({ ...form, managerId: val })}>
                                    <SelectTrigger><SelectValue placeholder="Yönetici seçin" /></SelectTrigger>
                                    <SelectContent>
                                        {managers.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Rol</Label>
                                <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EMPLOYEE">Çalışan</SelectItem>
                                        <SelectItem value="HR">İK Yöneticisi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="annualLeaveDays">Yıllık İzin Günü</Label>
                                <Input id="annualLeaveDays" type="number" value={form.annualLeaveDays} onChange={(e) => setForm({ ...form, annualLeaveDays: parseInt(e.target.value) })} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        İptal
                    </Button>
                    <Button type="submit" disabled={loading} className="gradient-primary text-white shadow-md">
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
