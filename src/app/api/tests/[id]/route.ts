import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/tests/[id]
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

        const { id } = await params;
        const test = await prisma.test.findFirst({
            where: { id, tenantId: session.tenantId },
            include: {
                createdBy: { select: { id: true, name: true } },
                questions: {
                    include: { options: { orderBy: { orderIndex: "asc" } } },
                    orderBy: { createdAt: "asc" },
                },
                categoryWeights: true,
                assignments: {
                    include: {
                        assignedTo: { select: { id: true, name: true } },
                    },
                },
                results: {
                    include: { user: { select: { id: true, name: true } } },
                    orderBy: { completedAt: "desc" },
                },
                _count: { select: { questions: true, assignments: true, results: true } },
            },
        });

        if (!test) return NextResponse.json({ error: "Test bulunamadı" }, { status: 404 });
        return NextResponse.json({ test });
    } catch (error) {
        console.error("Test detail error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// PUT /api/tests/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        if (session.role === "EMPLOYEE") return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

        const { id } = await params;
        const existing = await prisma.test.findFirst({ where: { id, tenantId: session.tenantId } });
        if (!existing) return NextResponse.json({ error: "Test bulunamadı" }, { status: 404 });

        const body = await request.json();
        const { title, description, durationMinutes, isRepeatable, isActive } = body;

        const data: Record<string, unknown> = {};
        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;
        if (durationMinutes !== undefined) data.durationMinutes = durationMinutes;
        if (isRepeatable !== undefined) data.isRepeatable = isRepeatable;
        if (isActive !== undefined) data.isActive = isActive;

        const test = await prisma.test.update({ where: { id }, data });
        return NextResponse.json({ test });
    } catch (error) {
        console.error("Test update error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// DELETE /api/tests/[id]
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        if (session.role === "EMPLOYEE") return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

        const { id } = await params;
        const existing = await prisma.test.findFirst({ where: { id, tenantId: session.tenantId } });
        if (!existing) return NextResponse.json({ error: "Test bulunamadı" }, { status: 404 });

        await prisma.test.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Test delete error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
