import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/tests — List tests
export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

        const tests = await prisma.test.findMany({
            where: { tenantId: session.tenantId },
            include: {
                createdBy: { select: { id: true, name: true } },
                _count: { select: { questions: true, assignments: true, results: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ tests });
    } catch (error) {
        console.error("Tests list error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// POST /api/tests — Create test with questions & category weights
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        if (session.role === "EMPLOYEE") return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

        const body = await request.json();
        const { title, description, durationMinutes, isRepeatable, questions, categoryWeights } = body;

        if (!title) return NextResponse.json({ error: "Test başlığı zorunludur" }, { status: 400 });

        const test = await prisma.test.create({
            data: {
                tenantId: session.tenantId,
                createdById: session.userId,
                title,
                description: description || null,
                durationMinutes: durationMinutes || null,
                isRepeatable: isRepeatable || false,
                questions: questions?.length ? {
                    create: questions.map((q: { questionText: string; category: string; correctOptionIndex: number; options: { optionText: string }[] }) => ({
                        questionText: q.questionText,
                        category: q.category,
                        correctOptionIndex: q.correctOptionIndex,
                        options: {
                            create: q.options.map((o: { optionText: string }, idx: number) => ({
                                optionText: o.optionText,
                                orderIndex: idx,
                            })),
                        },
                    })),
                } : undefined,
                categoryWeights: categoryWeights?.length ? {
                    create: categoryWeights.map((cw: { category: string; weightPercentage: number }) => ({
                        category: cw.category,
                        weightPercentage: cw.weightPercentage,
                    })),
                } : undefined,
            },
            include: {
                questions: { include: { options: true } },
                categoryWeights: true,
                _count: { select: { questions: true } },
            },
        });

        return NextResponse.json({ test }, { status: 201 });
    } catch (error) {
        console.error("Test create error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
