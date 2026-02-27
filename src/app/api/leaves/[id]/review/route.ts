import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// POST /api/leaves/[id]/review — Approve or reject leave
export async function POST(
    request: NextRequest,
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
        const existing = await prisma.leaveRequest.findFirst({
            where: { id, tenantId: session.tenantId },
        });

        if (!existing) {
            return NextResponse.json({ error: "İzin talebi bulunamadı" }, { status: 404 });
        }

        if (existing.status !== "PENDING") {
            return NextResponse.json({ error: "Bu talep zaten değerlendirilmiş" }, { status: 400 });
        }

        const body = await request.json();
        const { action, reviewNote } = body;

        if (!["APPROVED", "REJECTED"].includes(action)) {
            return NextResponse.json({ error: "Geçersiz işlem. 'APPROVED' veya 'REJECTED' olmalı" }, { status: 400 });
        }

        const leave = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status: action,
                reviewedById: session.userId,
                reviewNote: reviewNote || null,
            },
            include: {
                user: { select: { id: true, name: true } },
                reviewedBy: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ leave });
    } catch (error) {
        console.error("Leave review error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
