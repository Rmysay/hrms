"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Users, ClipboardCheck, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TestDetail {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number | null;
    isActive: boolean;
    isRepeatable: boolean;
    questions: { id: string; questionText: string; category: string; correctOptionIndex: number; options: { id: string; optionText: string }[] }[];
    categoryWeights: { category: string; weightPercentage: number }[];
    assignments: { id: string; assignedTo: { id: string; name: string }; deadline: string | null }[];
    results: { id: string; user: { id: string; name: string }; totalScore: number; categoryScores: Record<string, number>; completedAt: string }[];
    _count: { questions: number; assignments: number; results: number };
}

interface Employee { id: string; name: string; }

export default function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [test, setTest] = useState<TestDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [assignDialog, setAssignDialog] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [deadline, setDeadline] = useState("");

    useEffect(() => {
        fetch(`/api/tests/${id}`).then(r => r.json()).then(d => { setTest(d.test); setLoading(false); });
    }, [id]);

    const openAssignDialog = async () => {
        const res = await fetch("/api/employees");
        const data = await res.json();
        setEmployees(data.employees || []);
        setSelectedEmployees([]);
        setDeadline("");
        setAssignDialog(true);
    };

    const handleAssign = async () => {
        if (selectedEmployees.length === 0) { toast.error("En az bir çalışan seçin"); return; }
        try {
            const res = await fetch(`/api/tests/${id}/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ employeeIds: selectedEmployees, deadline: deadline || null }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error); return; }
            toast.success(`${data.assigned} çalışana atandı`);
            setAssignDialog(false);
            // Refresh
            const r = await fetch(`/api/tests/${id}`);
            const d = await r.json();
            setTest(d.test);
        } catch { toast.error("Sunucu hatası"); }
    };

    if (loading) return <div className="space-y-4"><div className="h-8 w-48 bg-muted animate-pulse rounded" /><div className="h-64 bg-muted animate-pulse rounded-xl" /></div>;
    if (!test) return <div className="text-center py-12"><p>Test bulunamadı</p></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Geri
            </Button>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{test.title}</h1>
                    {test.description && <p className="text-muted-foreground mt-1">{test.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                        <Badge variant={test.isActive ? "default" : "secondary"}>{test.isActive ? "Aktif" : "Pasif"}</Badge>
                        {test.durationMinutes && <span className="text-sm text-muted-foreground">{test.durationMinutes} dk</span>}
                        {test.isRepeatable && <Badge variant="outline">Tekrarlanabilir</Badge>}
                    </div>
                </div>
                <Button onClick={openAssignDialog} className="gradient-primary text-white">
                    <Users className="w-4 h-4 mr-2" /> Çalışanlara Ata
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Soru", value: test._count.questions, icon: <ClipboardCheck className="w-4 h-4" /> },
                    { label: "Atama", value: test._count.assignments, icon: <Users className="w-4 h-4" /> },
                    { label: "Sonuç", value: test._count.results, icon: <BarChart3 className="w-4 h-4" /> },
                ].map((s) => (
                    <Card key={s.label} className="border-0 shadow-sm">
                        <CardContent className="pt-4 pb-4 flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">{s.icon}</div>
                            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="questions">
                <TabsList>
                    <TabsTrigger value="questions">Sorular</TabsTrigger>
                    <TabsTrigger value="assignments">Atamalar</TabsTrigger>
                    <TabsTrigger value="results">Sonuçlar</TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="space-y-3 mt-4">
                    {test.questions.map((q, i) => (
                        <Card key={q.id} className="border-0 shadow-sm">
                            <CardContent className="py-4">
                                <p className="font-medium">S{i + 1}. {q.questionText}</p>
                                <Badge variant="outline" className="mt-1 text-xs">{q.category}</Badge>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {q.options.map((o, oIdx) => (
                                        <div key={o.id} className={`px-3 py-2 rounded-lg text-sm ${oIdx === q.correctOptionIndex ? "bg-emerald-50 text-emerald-700 font-medium border border-emerald-200" : "bg-muted"}`}>
                                            {String.fromCharCode(65 + oIdx)}. {o.optionText}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="assignments" className="mt-4">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="pt-4">
                            {test.assignments.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Henüz atama yapılmamış</p>
                            ) : (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Çalışan</TableHead><TableHead>Son Tarih</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {test.assignments.map((a) => (
                                            <TableRow key={a.id}>
                                                <TableCell className="font-medium">{a.assignedTo.name}</TableCell>
                                                <TableCell>{a.deadline ? new Date(a.deadline).toLocaleDateString("tr-TR") : "—"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="results" className="mt-4">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="pt-4">
                            {test.results.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Henüz sonuç yok</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Çalışan</TableHead>
                                            <TableHead>Puan</TableHead>
                                            <TableHead>Tarih</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {test.results.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">{r.user.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={r.totalScore >= 70 ? "default" : r.totalScore >= 50 ? "secondary" : "destructive"}>
                                                        %{r.totalScore.toFixed(0)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{new Date(r.completedAt).toLocaleDateString("tr-TR")}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Assign dialog */}
            <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Çalışanlara Ata</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {employees.map((emp) => (
                                <label key={emp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                                    <Checkbox
                                        checked={selectedEmployees.includes(emp.id)}
                                        onCheckedChange={(checked) => {
                                            setSelectedEmployees(checked
                                                ? [...selectedEmployees, emp.id]
                                                : selectedEmployees.filter((id) => id !== emp.id));
                                        }}
                                    />
                                    <span className="text-sm">{emp.name}</span>
                                </label>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Label>Son Tarih (Opsiyonel)</Label>
                            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setAssignDialog(false)}>İptal</Button>
                            <Button onClick={handleAssign} className="gradient-primary text-white">
                                Ata ({selectedEmployees.length})
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
