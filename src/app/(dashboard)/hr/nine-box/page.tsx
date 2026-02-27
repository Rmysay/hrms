"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

interface Evaluation {
    id: string;
    userId: string;
    performanceScore: number;
    potentialScore: number;
    notes: string | null;
    evaluatedAt: string;
    user: { id: string; name: string; email: string; department: { name: string } | null; position: { title: string } | null };
    evaluator: { id: string; name: string };
}

interface Employee { id: string; name: string; }

const boxLabels: Record<string, { label: string; color: string; bg: string }> = {
    "3-1": { label: "Bilmece", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    "3-2": { label: "Yükselen Yıldız", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    "3-3": { label: "Yıldız", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    "2-1": { label: "Riskli", color: "text-red-700", bg: "bg-red-50 border-red-200" },
    "2-2": { label: "Temel Oyuncu", color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
    "2-3": { label: "Yüksek Performans", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    "1-1": { label: "Ayrılık Adayı", color: "text-red-700", bg: "bg-red-50 border-red-200" },
    "1-2": { label: "Tutarlı", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    "1-3": { label: "İş Makinesi", color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
};

export default function NineBoxPage() {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({
        userId: "",
        performanceScore: "2",
        potentialScore: "2",
        notes: "",
    });

    const fetchData = async () => {
        try {
            const [evRes, empRes] = await Promise.all([
                fetch("/api/nine-box"),
                fetch("/api/employees"),
            ]);
            const evData = await evRes.json();
            const empData = await empRes.json();
            setEvaluations(evData.evaluations || []);
            setEmployees(empData.employees || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/nine-box", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: form.userId,
                    performanceScore: parseInt(form.performanceScore),
                    potentialScore: parseInt(form.potentialScore),
                    notes: form.notes || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error); return; }
            toast.success("Değerlendirme kaydedildi");
            setDialogOpen(false);
            setForm({ userId: "", performanceScore: "2", potentialScore: "2", notes: "" });
            fetchData();
        } catch { toast.error("Sunucu hatası"); }
    };

    // Group evaluations by box position
    const grid: Record<string, Evaluation[]> = {};
    for (const ev of evaluations) {
        const key = `${ev.potentialScore}-${ev.performanceScore}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push(ev);
    }

    const potentialLabels = ["Düşük", "Orta", "Yüksek"];
    const performanceLabels = ["Düşük", "Orta", "Yüksek"];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">9-Box Grid</h1>
                    <p className="text-muted-foreground text-sm mt-1">Çalışan performans ve potansiyel değerlendirmesi</p>
                </div>
                <Button onClick={() => setDialogOpen(true)} className="gradient-primary text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                    <Plus className="w-4 h-4 mr-2" /> Değerlendir
                </Button>
            </div>

            {/* Legend */}
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{evaluations.length} çalışan değerlendirildi</span>
                    </div>
                </CardContent>
            </Card>

            {/* Grid */}
            {loading ? (
                <div className="h-[500px] bg-muted animate-pulse rounded-xl" />
            ) : (
                <div className="relative">
                    {/* Y-axis label */}
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-muted-foreground tracking-wider whitespace-nowrap">
                        POTANSİYEL →
                    </div>

                    <div className="ml-4">
                        <div className="grid grid-cols-3 gap-2">
                            {/* Render 3x3 grid — top to bottom: high potential first */}
                            {[3, 2, 1].map((potential) => (
                                [1, 2, 3].map((performance) => {
                                    const key = `${potential}-${performance}`;
                                    const box = boxLabels[key];
                                    const items = grid[key] || [];

                                    return (
                                        <Card
                                            key={key}
                                            className={`border shadow-sm min-h-[140px] transition-all hover:shadow-md ${box.bg}`}
                                        >
                                            <CardHeader className="pb-1 pt-3 px-3">
                                                <CardTitle className={`text-xs font-semibold ${box.color}`}>
                                                    {box.label}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="px-3 pb-3 pt-0">
                                                <div className="space-y-1">
                                                    {items.map((ev) => (
                                                        <div
                                                            key={ev.id}
                                                            className="bg-white/80 backdrop-blur-sm rounded-md px-2 py-1.5 text-xs border border-white/50 shadow-sm cursor-default group"
                                                            title={`${ev.user.name}\n${ev.user.department?.name || ""}\nDeğerlendiren: ${ev.evaluator.name}`}
                                                        >
                                                            <p className="font-medium truncate">{ev.user.name}</p>
                                                            <p className="text-muted-foreground truncate text-[10px]">{ev.user.department?.name}</p>
                                                        </div>
                                                    ))}
                                                    {items.length === 0 && (
                                                        <p className="text-[10px] text-muted-foreground/50 pt-2">Boş</p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            ))}
                        </div>

                        {/* X-axis labels */}
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {performanceLabels.map((label) => (
                                <p key={label} className="text-xs text-center text-muted-foreground font-medium">{label}</p>
                            ))}
                        </div>
                        <p className="text-xs text-center text-muted-foreground font-semibold tracking-wider mt-1">PERFORMANS →</p>

                        {/* Y-axis labels — along left */}
                        <div className="absolute left-5 top-0 h-full flex flex-col justify-around">
                            {potentialLabels.reverse().map((label) => (
                                <span key={label} className="text-[10px] text-muted-foreground font-medium -rotate-0">{label}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Evaluation dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Çalışan Değerlendir</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Çalışan</Label>
                            <Select value={form.userId} onValueChange={(val) => setForm({ ...form, userId: val })}>
                                <SelectTrigger><SelectValue placeholder="Çalışan seçin" /></SelectTrigger>
                                <SelectContent>
                                    {employees.map((e) => (
                                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Performans (1-3)</Label>
                                <Select value={form.performanceScore} onValueChange={(val) => setForm({ ...form, performanceScore: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 — Düşük</SelectItem>
                                        <SelectItem value="2">2 — Orta</SelectItem>
                                        <SelectItem value="3">3 — Yüksek</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Potansiyel (1-3)</Label>
                                <Select value={form.potentialScore} onValueChange={(val) => setForm({ ...form, potentialScore: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 — Düşük</SelectItem>
                                        <SelectItem value="2">2 — Orta</SelectItem>
                                        <SelectItem value="3">3 — Yüksek</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Not</Label>
                            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Değerlendirme notları..." rows={2} />
                        </div>
                        {form.userId && (
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="text-xs text-muted-foreground">Sonuç kutusu:</p>
                                <Badge className={`mt-1 ${boxLabels[`${form.potentialScore}-${form.performanceScore}`]?.bg} ${boxLabels[`${form.potentialScore}-${form.performanceScore}`]?.color} border`}>
                                    {boxLabels[`${form.potentialScore}-${form.performanceScore}`]?.label}
                                </Badge>
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                            <Button type="submit" className="gradient-primary text-white">Kaydet</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
