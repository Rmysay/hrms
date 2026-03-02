"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, CalendarDays, Clock } from "lucide-react";

interface Assignment {
    id: string;
    testId: string;
    deadline: string | null;
    assignedAt: string;
    test: {
        id: string;
        title: string;
        description: string | null;
        durationMinutes: number | null;
        isActive: boolean;
        _count: { questions: number };
    };
}

interface Result {
    id: string;
    testId: string;
    totalScore: number;
    completedAt: string;
    test: { title: string };
}

export default function EmployeeTestsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/tests");
                const data = await res.json();
                setAssignments(data.assignments || []);
                setResults(data.results || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatDate = (d: string) => new Date(d).toLocaleDateString("tr-TR");
    const completedTestIds = new Set(results.map((r) => r.testId));
    const pendingAssignments = assignments.filter((a) => !completedTestIds.has(a.testId));

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold">Testlerim</h1>
                <p className="text-muted-foreground text-sm mt-1">Size atanan testleri çözün</p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
                </div>
            ) : (
                <>
                    {/* Pending tests */}
                    {pendingAssignments.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold">Bekleyen Testler ({pendingAssignments.length})</h2>
                            {pendingAssignments.map((a, i) => (
                                <Card key={a.id} className="border-0 shadow-sm border-l-4 border-l-primary animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                                    <CardContent className="py-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium">{a.test.title}</h3>
                                                {a.test.description && <p className="text-sm text-muted-foreground mt-1">{a.test.description}</p>}
                                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <ClipboardCheck className="w-3 h-3" /> {a.test._count.questions} soru
                                                    </span>
                                                    {a.test.durationMinutes && (
                                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.test.durationMinutes} dk</span>
                                                    )}
                                                    {a.deadline && (
                                                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Son: {formatDate(a.deadline)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Link href={`/employee/tests/${a.test.id}`}>
                                                <Button size="sm" className="gradient-primary text-white">Başla</Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Completed */}
                    {results.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-muted-foreground">Tamamlanan Testler ({results.length})</h2>
                            {results.map((r) => (
                                <Card key={r.id} className="border-0 shadow-sm">
                                    <CardContent className="py-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">{r.test.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-1">{formatDate(r.completedAt)}</p>
                                        </div>
                                        <Badge variant={r.totalScore >= 70 ? "default" : r.totalScore >= 50 ? "secondary" : "destructive"} className="text-sm">
                                            %{r.totalScore.toFixed(0)}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {pendingAssignments.length === 0 && results.length === 0 && (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <ClipboardCheck className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                                <p className="font-medium">Henüz test atanmamış</p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
