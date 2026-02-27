"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface QuestionForm {
    questionText: string;
    category: string;
    correctOptionIndex: number;
    options: { optionText: string }[];
}

export default function NewTestPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Test info
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [durationMinutes, setDurationMinutes] = useState<number | "">("");
    const [isRepeatable, setIsRepeatable] = useState(false);

    // Step 2: Questions
    const [questions, setQuestions] = useState<QuestionForm[]>([
        { questionText: "", category: "Genel", correctOptionIndex: 0, options: [{ optionText: "" }, { optionText: "" }, { optionText: "" }, { optionText: "" }] },
    ]);

    const addQuestion = () => {
        setQuestions([...questions, {
            questionText: "", category: "Genel", correctOptionIndex: 0,
            options: [{ optionText: "" }, { optionText: "" }, { optionText: "" }, { optionText: "" }],
        }]);
    };

    const removeQuestion = (idx: number) => {
        setQuestions(questions.filter((_, i) => i !== idx));
    };

    const updateQuestion = (idx: number, field: string, value: string | number) => {
        const updated = [...questions];
        (updated[idx] as unknown as Record<string, unknown>)[field] = value;
        setQuestions(updated);
    };

    const updateOption = (qIdx: number, oIdx: number, value: string) => {
        const updated = [...questions];
        updated[qIdx].options[oIdx].optionText = value;
        setQuestions(updated);
    };

    const handleSubmit = async () => {
        if (!title.trim()) { toast.error("Test başlığı zorunludur"); return; }

        const validQuestions = questions.filter((q) => q.questionText.trim() && q.options.every((o) => o.optionText.trim()));
        if (validQuestions.length === 0) { toast.error("En az bir geçerli soru ekleyin"); return; }

        // Derive categories for weights
        const categories = [...new Set(validQuestions.map((q) => q.category))];
        const weightPerCategory = Math.round((100 / categories.length) * 100) / 100;
        const categoryWeights = categories.map((cat) => ({ category: cat, weightPercentage: weightPerCategory }));

        setLoading(true);
        try {
            const res = await fetch("/api/tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    durationMinutes: durationMinutes || null,
                    isRepeatable,
                    questions: validQuestions,
                    categoryWeights,
                }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || "Test oluşturulamadı"); return; }
            toast.success("Test başarıyla oluşturuldu");
            router.push(`/hr/tests/${data.test.id}`);
        } catch { toast.error("Sunucu hatası"); }
        finally { setLoading(false); }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Yeni Test Oluştur</h1>
                    <p className="text-muted-foreground text-sm mt-1">Adım {step}/2</p>
                </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    1. Bilgiler
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    2. Sorular
                </div>
            </div>

            {step === 1 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader><CardTitle className="text-lg">Test Bilgileri</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Test Adı *</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Test başlığı" />
                        </div>
                        <div className="space-y-2">
                            <Label>Açıklama</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Test açıklaması..." rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Süre (dakika)</Label>
                                <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value) || "")} placeholder="Opsiyonel" />
                            </div>
                            <div className="flex items-center gap-2 pt-7">
                                <Checkbox checked={isRepeatable} onCheckedChange={(v) => setIsRepeatable(!!v)} id="repeatable" />
                                <Label htmlFor="repeatable" className="font-normal">Tekrarlanabilir</Label>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button onClick={() => { if (!title.trim()) { toast.error("Başlık zorunlu"); return; } setStep(2); }}>
                                Sonraki <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <>
                    {questions.map((q, qIdx) => (
                        <Card key={qIdx} className="border-0 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-base">Soru {qIdx + 1}</CardTitle>
                                {questions.length > 1 && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeQuestion(qIdx)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Soru Metni *</Label>
                                    <Textarea value={q.questionText} onChange={(e) => updateQuestion(qIdx, "questionText", e.target.value)} rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Kategori</Label>
                                    <Input value={q.category} onChange={(e) => updateQuestion(qIdx, "category", e.target.value)} placeholder="Genel" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Seçenekler (doğruyu işaretleyin)</Label>
                                    <div className="space-y-2">
                                        {q.options.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name={`correct-${qIdx}`}
                                                    checked={q.correctOptionIndex === oIdx}
                                                    onChange={() => updateQuestion(qIdx, "correctOptionIndex", oIdx)}
                                                    className="accent-primary"
                                                />
                                                <Input
                                                    value={opt.optionText}
                                                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                                    placeholder={`Seçenek ${String.fromCharCode(65 + oIdx)}`}
                                                    className="flex-1"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Button variant="outline" onClick={addQuestion} className="w-full border-dashed">
                        <Plus className="w-4 h-4 mr-2" /> Soru Ekle
                    </Button>

                    <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setStep(1)}>
                            <ArrowLeft className="w-4 h-4 mr-1" /> Geri
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading} className="gradient-primary text-white shadow-md">
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? "Oluşturuluyor..." : "Testi Oluştur"}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
