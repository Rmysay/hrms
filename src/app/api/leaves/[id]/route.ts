import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/leaves/[id] — Leave detail
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
        const leave = await prisma.leaveRequest.findFirst({
            where: { id, tenantId: session.tenantId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                reviewedBy: { select: { id: true, name: true } },
            },
        });

        if (!leave) {
            return NextResponse.json({ error: "İzin talebi bulunamadı" }, { status: 404 });
        }

        if (session.role === "EMPLOYEE" && leave.userId !== session.userId) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        return NextResponse.json({ leave });
    } catch (error) {
        console.error("Leave detail error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// PUT /api/leaves/[id] — Update leave (only if still PENDING)
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
        const existing = await prisma.leaveRequest.findFirst({
            where: { id, tenantId: session.tenantId },
        });

        if (!existing) {
            return NextResponse.json({ error: "İzin talebi bulunamadı" }, { status: 404 });
        }

        if (existing.status !== "PENDING") {
            return NextResponse.json({ error: "Sadece beklemedeki talepler güncellenebilir" }, { status: 400 });
        }

        if (session.role === "EMPLOYEE" && existing.userId !== session.userId) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const body = await request.json();
        const { leaveType, startDate, endDate, description } = body;

        const data: Record<string, unknown> = {};
        if (leaveType) data.leaveType = leaveType;
        if (startDate) data.startDate = new Date(startDate);
        if (endDate) data.endDate = new Date(endDate);
        if (description !== undefined) data.description = description;

        const leave = await prisma.leaveRequest.update({
            where: { id },
            data,
            include: { user: { select: { id: true, name: true } } },
        });

        return NextResponse.json({ leave });
    } catch (error) {
        console.error("Leave update error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
