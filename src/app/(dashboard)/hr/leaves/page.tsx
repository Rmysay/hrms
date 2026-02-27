"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Leave {
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    description: string | null;
    status: string;
    reviewNote: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string; annualLeaveDays: number; department: { name: string } | null };
    reviewedBy: { id: string; name: string } | null;
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

export default function HRLeavesPage() {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [reviewDialog, setReviewDialog] = useState<Leave | null>(null);
    const [reviewNote, setReviewNote] = useState("");

    const fetchLeaves = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filterStatus !== "all") params.set("status", filterStatus);

        try {
            const res = await fetch(`/api/leaves?${params}`);
            const data = await res.json();
            setLeaves(data.leaves || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeaves(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filterStatus]);

    const handleReview = async (action: string) => {
        if (!reviewDialog) return;
        try {
            const res = await fetch(`/api/leaves/${reviewDialog.id}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, reviewNote }),
            });
            if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
            toast.success(action === "APPROVED" ? "İzin onaylandı" : "İzin reddedildi");
            setReviewDialog(null);
            setReviewNote("");
            fetchLeaves();
        } catch { toast.error("Sunucu hatası"); }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString("tr-TR");
    const dayCount = (s: string, e: string) => {
        const diff = new Date(e).getTime() - new Date(s).getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold">İzin Talepleri</h1>
                <p className="text-muted-foreground text-sm mt-1">Çalışanların izin taleplerini yönetin</p>
            </div>

            {/* Review dialog */}
            <Dialog open={!!reviewDialog} onOpenChange={(open) => !open && setReviewDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>İzin Talebi Değerlendir</DialogTitle>
                    </DialogHeader>
                    {reviewDialog && (
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-muted-foreground">Çalışan:</span> <strong>{reviewDialog.user.name}</strong></div>
                                <div><span className="text-muted-foreground">Tür:</span> {leaveTypeMap[reviewDialog.leaveType]}</div>
                                <div><span className="text-muted-foreground">Tarih:</span> {formatDate(reviewDialog.startDate)} – {formatDate(reviewDialog.endDate)}</div>
                                <div><span className="text-muted-foreground">Süre:</span> {dayCount(reviewDialog.startDate, reviewDialog.endDate)} gün</div>
                            </div>
                            {reviewDialog.description && (
                                <p className="text-sm bg-muted p-3 rounded-lg">{reviewDialog.description}</p>
                            )}
                            <div className="space-y-2">
                                <Label>Not (Opsiyonel)</Label>
                                <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Değerlendirme notu..." rows={2} />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="destructive" onClick={() => handleReview("REJECTED")} className="gap-1">
                                    <X className="w-4 h-4" /> Reddet
                                </Button>
                                <Button onClick={() => handleReview("APPROVED")} className="gradient-primary text-white gap-1">
                                    <Check className="w-4 h-4" /> Onayla
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Filter */}
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Durum" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Durumlar</SelectItem>
                            <SelectItem value="PENDING">Beklemede</SelectItem>
                            <SelectItem value="APPROVED">Onaylandı</SelectItem>
                            <SelectItem value="REJECTED">Reddedildi</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-medium text-muted-foreground">
                        {loading ? "Yükleniyor..." : `${leaves.length} izin talebi`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
                        </div>
                    ) : leaves.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <CalendarDays className="w-12 h-12 mb-3 opacity-50" />
                            <p className="font-medium">İzin talebi bulunamadı</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Çalışan</TableHead>
                                    <TableHead>Tür</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Süre</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaves.map((leave) => (
                                    <TableRow key={leave.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{leave.user.name}</p>
                                                <p className="text-xs text-muted-foreground">{leave.user.department?.name}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{leaveTypeMap[leave.leaveType]}</TableCell>
                                        <TableCell className="text-sm">
                                            {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                                        </TableCell>
                                        <TableCell>{dayCount(leave.startDate, leave.endDate)} gün</TableCell>
                                        <TableCell>
                                            <Badge variant={statusMap[leave.status]?.variant}>
                                                {statusMap[leave.status]?.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {leave.status === "PENDING" ? (
                                                <Button size="sm" variant="outline" onClick={() => setReviewDialog(leave)}>
                                                    Değerlendir
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    {leave.reviewedBy?.name}
                                                </span>
                                            )}
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
