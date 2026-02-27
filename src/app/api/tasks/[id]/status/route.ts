import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// PATCH /api/tasks/[id]/status — Quick status update (employees can use this)
export async function PATCH(
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

        // Employees can only update their own tasks' status
        if (session.role === "EMPLOYEE" && existing.assignedToId !== session.userId) {
            return NextResponse.json({ error: "Bu görevi güncelleme yetkiniz yok" }, { status: 403 });
        }

        const { status } = await request.json();

        if (!["PENDING", "IN_PROGRESS", "COMPLETED"].includes(status)) {
            return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
        }

        const data: Record<string, unknown> = { status };
        if (status === "COMPLETED") data.completedAt = new Date();
        else data.completedAt = null;

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
        console.error("Task status update error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
