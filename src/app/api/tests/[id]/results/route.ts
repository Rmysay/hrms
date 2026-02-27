import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/tests/[id]/results
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

        const { id } = await params;

        const where: Record<string, unknown> = { testId: id };
        // Employees only see their own results
        if (session.role === "EMPLOYEE") where.userId = session.userId;

        const results = await prisma.testResult.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true } },
                test: { select: { title: true } },
            },
            orderBy: { completedAt: "desc" },
        });

        return NextResponse.json({ results });
    } catch (error) {
        console.error("Test results error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
