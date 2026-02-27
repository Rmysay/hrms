import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/leaves — List leave requests
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const where: Record<string, unknown> = { tenantId: session.tenantId };

        // Employees only see their own leave requests
        if (session.role === "EMPLOYEE") {
            where.userId = session.userId;
        }

        if (status && status !== "all") where.status = status;

        const leaves = await prisma.leaveRequest.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, annualLeaveDays: true, department: { select: { name: true } } } },
                reviewedBy: { select: { id: true, name: true } },
            },
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        });

        return NextResponse.json({ leaves });
    } catch (error) {
        console.error("Leaves list error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// POST /api/leaves — Create leave request
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const body = await request.json();
        const { leaveType, startDate, endDate, description } = body;

        if (!leaveType || !startDate || !endDate) {
            return NextResponse.json({ error: "İzin türü, başlangıç ve bitiş tarihi zorunludur" }, { status: 400 });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            return NextResponse.json({ error: "Bitiş tarihi başlangıç tarihinden önce olamaz" }, { status: 400 });
        }

        const leave = await prisma.leaveRequest.create({
            data: {
                userId: session.userId,
                tenantId: session.tenantId,
                leaveType,
                startDate: start,
                endDate: end,
                description: description || null,
            },
            include: {
                user: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ leave }, { status: 201 });
    } catch (error) {
        console.error("Leave create error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
