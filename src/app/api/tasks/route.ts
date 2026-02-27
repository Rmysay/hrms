import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/tasks — List tasks with filters
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const priority = searchParams.get("priority");
        const assignedToId = searchParams.get("assignedToId");

        const where: Record<string, unknown> = { tenantId: session.tenantId };

        // Employees only see their own tasks
        if (session.role === "EMPLOYEE") {
            where.assignedToId = session.userId;
        } else if (assignedToId) {
            where.assignedToId = assignedToId;
        }

        if (status && status !== "all") where.status = status;
        if (priority && priority !== "all") where.priority = priority;

        const tasks = await prisma.task.findMany({
            where,
            include: {
                assignedTo: { select: { id: true, name: true } },
                assignedBy: { select: { id: true, name: true } },
            },
            orderBy: [{ status: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
        });

        return NextResponse.json({ tasks });
    } catch (error) {
        console.error("Tasks list error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// POST /api/tasks — Create a new task
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        if (session.role === "EMPLOYEE") {
            return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, priority, deadline, assignedToId } = body;

        if (!title) {
            return NextResponse.json({ error: "Görev başlığı zorunludur" }, { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                tenantId: session.tenantId,
                title,
                description: description || null,
                priority: priority || "MEDIUM",
                deadline: deadline ? new Date(deadline) : null,
                assignedToId: assignedToId || null,
                assignedById: session.userId,
            },
            include: {
                assignedTo: { select: { id: true, name: true } },
                assignedBy: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ task }, { status: 201 });
    } catch (error) {
        console.error("Task create error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
