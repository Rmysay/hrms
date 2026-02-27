import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// POST /api/tests/[id]/submit — Submit test answers and calculate score
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

        const { id } = await params;
        const test = await prisma.test.findFirst({
            where: { id, tenantId: session.tenantId },
            include: {
                questions: { include: { options: { orderBy: { orderIndex: "asc" } } } },
                categoryWeights: true,
            },
        });

        if (!test) return NextResponse.json({ error: "Test bulunamadı" }, { status: 404 });

        // Check if already completed (unless repeatable)
        if (!test.isRepeatable) {
            const existing = await prisma.testResult.findFirst({
                where: { testId: id, userId: session.userId },
            });
            if (existing) return NextResponse.json({ error: "Bu testi zaten tamamladınız" }, { status: 400 });
        }

        const body = await request.json();
        const { answers, durationSeconds } = body;
        // answers: { [questionId]: selectedOptionIndex }

        if (!answers || typeof answers !== "object") {
            return NextResponse.json({ error: "Cevaplar gereklidir" }, { status: 400 });
        }

        // Calculate scores by category
        const categoryScores: Record<string, { correct: number; total: number }> = {};

        for (const question of test.questions) {
            const cat = question.category;
            if (!categoryScores[cat]) categoryScores[cat] = { correct: 0, total: 0 };
            categoryScores[cat].total++;

            const selectedIndex = answers[question.id];
            if (selectedIndex !== undefined && selectedIndex === question.correctOptionIndex) {
                categoryScores[cat].correct++;
            }
        }

        // Calculate weighted total score
        let totalScore = 0;
        const totalQuestions = test.questions.length;

        if (test.categoryWeights.length > 0) {
            // Weighted scoring
            for (const cw of test.categoryWeights) {
                const cs = categoryScores[cw.category];
                if (cs && cs.total > 0) {
                    totalScore += (cs.correct / cs.total) * cw.weightPercentage;
                }
            }
        } else {
            // Simple average
            let correct = 0;
            for (const cs of Object.values(categoryScores)) correct += cs.correct;
            totalScore = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
        }

        // Save to percentage format in categoryScores
        const categoryScoresPercent: Record<string, number> = {};
        for (const [cat, { correct, total }] of Object.entries(categoryScores)) {
            categoryScoresPercent[cat] = total > 0 ? Math.round((correct / total) * 100) : 0;
        }

        const result = await prisma.testResult.create({
            data: {
                testId: id,
                userId: session.userId,
                totalScore: Math.round(totalScore * 100) / 100,
                categoryScores: categoryScoresPercent,
                durationSeconds: durationSeconds || null,
            },
        });

        return NextResponse.json({
            result,
            totalScore: result.totalScore,
            categoryScores: categoryScoresPercent,
        });
    } catch (error) {
        console.error("Test submit error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
