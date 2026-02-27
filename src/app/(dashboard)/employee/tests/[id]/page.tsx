"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface TestData {
    id: string;
    title: string;
    durationMinutes: number | null;
    questions: {
        id: string;
        questionText: string;
        category: string;
        options: { id: string; optionText: string; orderIndex: number }[];
    }[];
}

export default function TakeTestPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [test, setTest] = useState<TestData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [started, setStarted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ totalScore: number; categoryScores: Record<string, number> } | null>(null);
    const [startTime, setStartTime] = useState<number>(0);

    useEffect(() => {
        fetch(`/api/tests/${id}`).then(r => r.json()).then(d => {
            setTest(d.test);
            if (d.test?.durationMinutes) setTimeLeft(d.test.durationMinutes * 60);
            setLoading(false);
        });
    }, [id]);

    const handleSubmit = useCallback(async () => {
        if (submitting || !test) return;
        setSubmitting(true);
        const durationSeconds = Math.round((Date.now() - startTime) / 1000);
        try {
            const res = await fetch(`/api/tests/${id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers, durationSeconds }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error); setSubmitting(false); return; }
            setResult({ totalScore: data.totalScore, categoryScores: data.categoryScores });
            toast.success("Test tamamlandı!");
        } catch { toast.error("Sunucu hatası"); setSubmitting(false); }
    }, [submitting, test, startTime, id, answers]);

    // Timer
    useEffect(() => {
        if (!started || timeLeft === null) return;
        if (timeLeft <= 0) { handleSubmit(); return; }
        const interval = setInterval(() => setTimeLeft((t) => t !== null ? t - 1 : null), 1000);
        return () => clearInterval(interval);
    }, [started, timeLeft, handleSubmit]);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    if (loading) return <div className="max-w-2xl mx-auto space-y-4"><div className="h-8 w-48 bg-muted animate-pulse rounded" /><div className="h-64 bg-muted animate-pulse rounded-xl" /></div>;
    if (!test) return <div className="text-center py-12"><p>Test bulunamadı</p></div>;

    // Result screen
    if (result) {
        return (
            <div className="max-w-lg mx-auto space-y-6 animate-fade-in text-center">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                <h1 className="text-2xl font-bold">Test Tamamlandı!</h1>
                <Card className="border-0 shadow-sm">
                    <CardContent className="py-8">
                        <p className="text-4xl font-bold" style={{ color: result.totalScore >= 70 ? "#10b981" : result.totalScore >= 50 ? "#f59e0b" : "#ef4444" }}>
                            %{result.totalScore.toFixed(0)}
                        </p>
                        <p className="text-muted-foreground mt-2">Genel Puan</p>
                        {Object.keys(result.categoryScores).length > 0 && (
                            <div className="mt-4 space-y-2">
                                {Object.entries(result.categoryScores).map(([cat, score]) => (
                                    <div key={cat} className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">{cat}</span>
                                        <Badge variant={score >= 70 ? "default" : score >= 50 ? "secondary" : "destructive"}>%{score}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Button onClick={() => router.push("/employee/tests")} className="mx-auto">Testlere Dön</Button>
            </div>
        );
    }

    // Start screen
    if (!started) {
        return (
            <div className="max-w-lg mx-auto space-y-6 animate-fade-in text-center">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 self-start">
                    <ArrowLeft className="w-4 h-4" /> Geri
                </Button>
                <h1 className="text-2xl font-bold">{test.title}</h1>
                <Card className="border-0 shadow-sm">
                    <CardContent className="py-8 space-y-4">
                        <p className="text-muted-foreground">{test.questions.length} soru</p>
                        {test.durationMinutes && (
                            <p className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" /> {test.durationMinutes} dakika
                            </p>
                        )}
                        <Button size="lg" onClick={() => { setStarted(true); setStartTime(Date.now()); }} className="gradient-primary text-white shadow-md mt-4">
                            Teste Başla
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Question screen
    const q = test.questions[currentQ];
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
            {/* Top bar */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">
                    Soru {currentQ + 1}/{test.questions.length}
                </span>
                <div className="flex items-center gap-3">
                    <Badge variant="outline">{answeredCount}/{test.questions.length} cevaplandı</Badge>
                    {timeLeft !== null && (
                        <Badge variant={timeLeft < 60 ? "destructive" : "secondary"} className="gap-1 text-sm font-mono">
                            <Clock className="w-3 h-3" /> {formatTime(timeLeft)}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((currentQ + 1) / test.questions.length) * 100}%` }} />
            </div>

            {/* Question */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <Badge variant="outline" className="w-fit text-xs">{q.category}</Badge>
                    <CardTitle className="text-lg mt-2">{q.questionText}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {q.options.map((opt, idx) => (
                        <button
                            key={opt.id}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: idx }))}
                            className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${answers[q.id] === idx
                                    ? "border-primary bg-primary/10 font-medium"
                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                                }`}
                        >
                            <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                            {opt.optionText}
                        </button>
                    ))}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentQ((p) => Math.max(0, p - 1))} disabled={currentQ === 0}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Önceki
                </Button>
                {currentQ === test.questions.length - 1 ? (
                    <Button onClick={handleSubmit} disabled={submitting} className="gradient-primary text-white shadow-md">
                        {submitting ? "Gönderiliyor..." : "Testi Bitir"}
                    </Button>
                ) : (
                    <Button onClick={() => setCurrentQ((p) => Math.min(test.questions.length - 1, p + 1))}>
                        Sonraki <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                )}
            </div>

            {/* Question dots */}
            <div className="flex gap-1 justify-center flex-wrap">
                {test.questions.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentQ(i)}
                        className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${i === currentQ ? "bg-primary text-primary-foreground" :
                                answers[test.questions[i].id] !== undefined ? "bg-emerald-100 text-emerald-700" :
                                    "bg-muted"
                            }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}
