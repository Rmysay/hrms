"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Search, UserCircle } from "lucide-react";

interface Employee {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    startDate: string | null;
    department: { id: string; name: string } | null;
    position: { id: string; name: string } | null;
    manager: { id: string; name: string } | null;
}

interface Department {
    id: string;
    name: string;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterDept, setFilterDept] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (filterDept && filterDept !== "all") params.set("departmentId", filterDept);
            if (filterStatus && filterStatus !== "all") params.set("status", filterStatus);

            const res = await fetch(`/api/employees?${params}`);
            const data = await res.json();
            setEmployees(data.employees || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/departments");
            const data = await res.json();
            setDepartments(data.departments || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        const timer = setTimeout(fetchEmployees, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filterDept, filterStatus]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Çalışanlar</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Tüm çalışanlarınızı yönetin
                    </p>
                </div>
                <Link href="/hr/employees/new">
                    <Button className="gradient-primary text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Çalışan
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="İsim veya email ile ara..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={filterDept} onValueChange={setFilterDept}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Departman" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Departmanlar</SelectItem>
                                {departments.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder="Durum" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü</SelectItem>
                                <SelectItem value="active">Aktif</SelectItem>
                                <SelectItem value="inactive">Pasif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Employee table */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-medium text-muted-foreground">
                        {loading ? "Yükleniyor..." : `${employees.length} çalışan bulundu`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                            ))}
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <UserCircle className="w-12 h-12 mb-3 opacity-50" />
                            <p className="font-medium">Çalışan bulunamadı</p>
                            <p className="text-sm mt-1">Yeni bir çalışan ekleyerek başlayın</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ad Soyad</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Departman</TableHead>
                                    <TableHead>Pozisyon</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.map((emp) => (
                                    <TableRow key={emp.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium">{emp.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                                        <TableCell>
                                            {emp.department ? (
                                                <Badge variant="secondary" className="font-normal">
                                                    {emp.department.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {emp.position?.name || <span className="text-muted-foreground text-sm">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={emp.isActive ? "default" : "destructive"} className="text-xs">
                                                {emp.isActive ? "Aktif" : "Pasif"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/hr/employees/${emp.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    Görüntüle
                                                </Button>
                                            </Link>
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
