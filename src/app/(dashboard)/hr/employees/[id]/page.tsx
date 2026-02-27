"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, Calendar, Building2, Briefcase, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Employee {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    birthDate: string | null;
    startDate: string | null;
    annualLeaveDays: number;
    department: { id: string; name: string } | null;
    position: { id: string; name: string } | null;
    manager: { id: string; name: string } | null;
    subordinates: { id: string; name: string; position: { name: string } | null }[];
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const res = await fetch(`/api/employees/${id}`);
                const data = await res.json();
                if (res.ok) setEmployee(data.employee);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployee();
    }, [id]);

    if (loading) {
        return (
            <div className="space-y-4 animate-fade-in">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="h-64 bg-muted animate-pulse rounded-xl" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <UserCircle className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Çalışan bulunamadı</p>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>Geri Dön</Button>
            </div>
        );
    }

    const initials = employee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("tr-TR") : "—";

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Geri
            </Button>

            {/* Profile header */}
            <Card className="border-0 shadow-sm overflow-hidden">
                <div className="h-24 gradient-primary" />
                <CardContent className="-mt-12 pb-6">
                    <div className="flex items-end gap-4 mb-4">
                        <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                            <AvatarFallback className="gradient-primary text-white text-xl font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 pb-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{employee.name}</h1>
                                <Badge variant={employee.isActive ? "default" : "destructive"}>
                                    {employee.isActive ? "Aktif" : "Pasif"}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">
                                {employee.position?.name || "Pozisyon atanmamış"}
                                {employee.department && ` · ${employee.department.name}`}
                            </p>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span>{employee.email}</span>
                        </div>
                        {employee.phone && (
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{employee.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>Doğum: {formatDate(employee.birthDate)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            <span>Başlangıç: {formatDate(employee.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span>{employee.department?.name || "Departman atanmamış"}</span>
                        </div>
                        {employee.manager && (
                            <div className="flex items-center gap-3 text-sm">
                                <UserCircle className="w-4 h-4 text-muted-foreground" />
                                <span>Yönetici: {employee.manager.name}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Info cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">İzin Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{employee.annualLeaveDays}</div>
                        <p className="text-sm text-muted-foreground mt-1">Yıllık izin hakkı (gün)</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Ekip Üyeleri</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {employee.subordinates && employee.subordinates.length > 0 ? (
                            <div className="space-y-2">
                                {employee.subordinates.map((sub) => (
                                    <div key={sub.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs">{sub.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{sub.name}</p>
                                            <p className="text-xs text-muted-foreground">{sub.position?.name || "—"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Ekip üyesi bulunmamaktadır</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
