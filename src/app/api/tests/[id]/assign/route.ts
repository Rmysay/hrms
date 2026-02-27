import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// POST /api/tests/[id]/assign — Assign test to employees
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        if (session.role === "EMPLOYEE") return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

        const { id } = await params;
        const test = await prisma.test.findFirst({ where: { id, tenantId: session.tenantId } });
        if (!test) return NextResponse.json({ error: "Test bulunamadı" }, { status: 404 });

        const body = await request.json();
        const { employeeIds, deadline } = body;

        if (!employeeIds?.length) return NextResponse.json({ error: "En az bir çalışan seçilmelidir" }, { status: 400 });

        // Filter out already assigned employees
        const existing = await prisma.testAssignment.findMany({
            where: { testId: id, assignedToId: { in: employeeIds } },
            select: { assignedToId: true },
        });
        const existingIds = new Set(existing.map((e) => e.assignedToId));
        const newIds = employeeIds.filter((eid: string) => !existingIds.has(eid));

        if (newIds.length === 0) return NextResponse.json({ error: "Seçilen tüm çalışanlar zaten atanmış" }, { status: 400 });

        await prisma.testAssignment.createMany({
            data: newIds.map((eid: string) => ({
                testId: id,
                assignedToId: eid,
                assignedById: session.userId,
                deadline: deadline ? new Date(deadline) : null,
            })),
        });

        return NextResponse.json({ assigned: newIds.length });
    } catch (error) {
        console.error("Test assign error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
