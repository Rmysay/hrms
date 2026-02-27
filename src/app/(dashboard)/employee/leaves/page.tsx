"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, CalendarDays } from "lucide-react";
import { toast } from "sonner";

interface Leave {
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    description: string | null;
    status: string;
    reviewNote: string | null;
    reviewedBy: { name: string } | null;
    createdAt: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING: { label: "Beklemede", variant: "secondary" },
    APPROVED: { label: "Onaylandı", variant: "default" },
    REJECTED: { label: "Reddedildi", variant: "destructive" },
};

const leaveTypeMap: Record<string, string> = {
    ANNUAL: "Yıllık İzin",
    EXCUSE: "Mazeret İzni",
    UNPAID: "Ücretsiz İzin",
};

export default function EmployeeLeavesPage() {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({
        leaveType: "ANNUAL",
        startDate: "",
        endDate: "",
        description: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchLeaves = async () => {
        try {
            const res = await fetch("/api/leaves");
            const data = await res.json();
            setLeaves(data.leaves || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/leaves", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error); return; }
            toast.success("İzin talebi oluşturuldu");
            setDialogOpen(false);
            setForm({ leaveType: "ANNUAL", startDate: "", endDate: "", description: "" });
            fetchLeaves();
        } catch { toast.error("Sunucu hatası"); }
        finally { setSubmitting(false); }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString("tr-TR");
    const dayCount = (s: string, e: string) => Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const pending = leaves.filter((l) => l.status === "PENDING");
    const resolved = leaves.filter((l) => l.status !== "PENDING");

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">İzin Taleplerim</h1>
                    <p className="text-muted-foreground text-sm mt-1">İzin taleplerinizi yönetin</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-primary text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                            <Plus className="w-4 h-4 mr-2" /> Yeni Talep
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni İzin Talebi</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label>İzin Türü</Label>
                                <Select value={form.leaveType} onValueChange={(val) => setForm({ ...form, leaveType: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ANNUAL">Yıllık İzin</SelectItem>
                                        <SelectItem value="EXCUSE">Mazeret İzni</SelectItem>
                                        <SelectItem value="UNPAID">Ücretsiz İzin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Başlangıç</Label>
                                    <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bitiş</Label>
                                    <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Açıklama</Label>
                                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="İzin sebebi..." rows={3} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                                <Button type="submit" disabled={submitting} className="gradient-primary text-white">
                                    {submitting ? "Gönderiliyor..." : "Gönder"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
                </div>
            ) : leaves.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <CalendarDays className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                        <p className="font-medium">Henüz izin talebi bulunmamaktadır</p>
                        <p className="text-sm text-muted-foreground mt-1">Yeni bir talep oluşturarak başlayın</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {pending.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold">Bekleyen Talepler ({pending.length})</h2>
                            {pending.map((leave, i) => (
                                <Card key={leave.id} className="border-0 shadow-sm border-l-4 border-l-amber-400 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                                    <CardContent className="py-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{leaveTypeMap[leave.leaveType]}</span>
                                                    <Badge variant="secondary">Beklemede</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {formatDate(leave.startDate)} – {formatDate(leave.endDate)} ({dayCount(leave.startDate, leave.endDate)} gün)
                                                </p>
                                                {leave.description && <p className="text-sm mt-2">{leave.description}</p>}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {resolved.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-muted-foreground">Geçmiş Talepler ({resolved.length})</h2>
                            {resolved.map((leave) => (
                                <Card key={leave.id} className="border-0 shadow-sm">
                                    <CardContent className="py-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{leaveTypeMap[leave.leaveType]}</span>
                                                    <Badge variant={statusMap[leave.status]?.variant}>{statusMap[leave.status]?.label}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {formatDate(leave.startDate)} – {formatDate(leave.endDate)} ({dayCount(leave.startDate, leave.endDate)} gün)
                                                </p>
                                                {leave.reviewNote && (
                                                    <p className="text-sm mt-2 text-muted-foreground italic">Not: {leave.reviewNote}</p>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">{leave.reviewedBy?.name}</span>
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
