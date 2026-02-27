"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, ClipboardCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Test {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number | null;
    isActive: boolean;
    isRepeatable: boolean;
    createdBy: { name: string };
    _count: { questions: number; assignments: number; results: number };
    createdAt: string;
}

export default function HRTestsPage() {
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTests = async () => {
        try {
            const res = await fetch("/api/tests");
            const data = await res.json();
            setTests(data.tests || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTests(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Bu testi silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/tests/${id}`, { method: "DELETE" });
            if (!res.ok) { toast.error("Test silinemedi"); return; }
            toast.success("Test silindi");
            fetchTests();
        } catch { toast.error("Sunucu hatası"); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Testler</h1>
                    <p className="text-muted-foreground text-sm mt-1">Test oluşturun ve yönetin</p>
                </div>
                <Link href="/hr/tests/new">
                    <Button className="gradient-primary text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                        <Plus className="w-4 h-4 mr-2" /> Yeni Test
                    </Button>
                </Link>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-medium text-muted-foreground">
                        {loading ? "Yükleniyor..." : `${tests.length} test`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
                        </div>
                    ) : tests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <ClipboardCheck className="w-12 h-12 mb-3 opacity-50" />
                            <p className="font-medium">Test bulunamadı</p>
                            <p className="text-sm mt-1">Yeni bir test oluşturarak başlayın</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Test Adı</TableHead>
                                    <TableHead>Sorular</TableHead>
                                    <TableHead>Atamalar</TableHead>
                                    <TableHead>Sonuçlar</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tests.map((test) => (
                                    <TableRow key={test.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <Link href={`/hr/tests/${test.id}`} className="hover:underline">
                                                <p className="font-medium">{test.title}</p>
                                                {test.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{test.description}</p>}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{test._count.questions}</TableCell>
                                        <TableCell>{test._count.assignments}</TableCell>
                                        <TableCell>{test._count.results}</TableCell>
                                        <TableCell>
                                            <Badge variant={test.isActive ? "default" : "secondary"}>
                                                {test.isActive ? "Aktif" : "Pasif"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right flex gap-1 justify-end">
                                            <Link href={`/hr/tests/${test.id}`}>
                                                <Button variant="ghost" size="sm">Detay</Button>
                                            </Link>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(test.id)}>
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
