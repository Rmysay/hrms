import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/tasks/[id] — Task detail
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const { id } = await params;
        const task = await prisma.task.findFirst({
            where: { id, tenantId: session.tenantId },
            include: {
                assignedTo: { select: { id: true, name: true, email: true } },
                assignedBy: { select: { id: true, name: true } },
            },
        });

        if (!task) {
            return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 });
        }

        // Employees can only see their own tasks
        if (session.role === "EMPLOYEE" && task.assignedToId !== session.userId) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        return NextResponse.json({ task });
    } catch (error) {
        console.error("Task detail error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// PUT /api/tasks/[id] — Update task
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const { id } = await params;
        const existing = await prisma.task.findFirst({
            where: { id, tenantId: session.tenantId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 });
        }

        const body = await request.json();
        const { title, description, priority, deadline, assignedToId, status } = body;

        const data: Record<string, unknown> = {};
        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;
        if (priority !== undefined) data.priority = priority;
        if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;
        if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
        if (status !== undefined) {
            data.status = status;
            if (status === "COMPLETED") data.completedAt = new Date();
            else data.completedAt = null;
        }

        const task = await prisma.task.update({
            where: { id },
            data,
            include: {
                assignedTo: { select: { id: true, name: true } },
                assignedBy: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ task });
    } catch (error) {
        console.error("Task update error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// DELETE /api/tasks/[id] — Delete task
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        if (session.role === "EMPLOYEE") {
            return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
        }

        const { id } = await params;
        const existing = await prisma.task.findFirst({
            where: { id, tenantId: session.tenantId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 });
        }

        await prisma.task.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Task delete error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
