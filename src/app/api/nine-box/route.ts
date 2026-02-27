import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/nine-box — Get all evaluations for the grid
export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        if (session.role === "EMPLOYEE") return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

        const evaluations = await prisma.nineBoxEvaluation.findMany({
            where: { tenantId: session.tenantId },
            include: {
                user: { select: { id: true, name: true, email: true, department: { select: { name: true } }, position: { select: { name: true } } } },
                evaluator: { select: { id: true, name: true } },
            },
            orderBy: { evaluatedAt: "desc" },
        });

        // Get latest evaluation per user
        const latestByUser = new Map<string, typeof evaluations[0]>();
        for (const ev of evaluations) {
            if (!latestByUser.has(ev.userId)) latestByUser.set(ev.userId, ev);
        }

        return NextResponse.json({ evaluations: Array.from(latestByUser.values()) });
    } catch (error) {
        console.error("9-Box list error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// POST /api/nine-box — Create/update an evaluation
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        if (session.role === "EMPLOYEE") return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

        const body = await request.json();
        const { userId, performanceScore, potentialScore, notes } = body;

        if (!userId || performanceScore === undefined || potentialScore === undefined) {
            return NextResponse.json({ error: "Çalışan, performans ve potansiyel puanı zorunludur" }, { status: 400 });
        }

        if (performanceScore < 1 || performanceScore > 3 || potentialScore < 1 || potentialScore > 3) {
            return NextResponse.json({ error: "Puanlar 1-3 arasında olmalıdır" }, { status: 400 });
        }

        const evaluation = await prisma.nineBoxEvaluation.create({
            data: {
                userId,
                tenantId: session.tenantId,
                evaluatorId: session.userId,
                performanceScore,
                potentialScore,
                notes: notes || null,
            },
            include: {
                user: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ evaluation }, { status: 201 });
    } catch (error) {
        console.error("9-Box create error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
