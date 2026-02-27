import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// PUT — Departman güncelle
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || (session.role !== "HR" && session.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const { id } = await params;
        const { name, managerId } = await request.json();

        const existing = await prisma.department.findFirst({
            where: { id, tenantId: session.tenantId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Departman bulunamadı" }, { status: 404 });
        }

        const department = await prisma.department.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(managerId !== undefined && { managerId: managerId || null }),
            },
            include: {
                manager: { select: { id: true, name: true } },
                _count: { select: { members: true, positions: true } },
            },
        });

        return NextResponse.json({ department });
    } catch (error) {
        console.error("Department update error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// DELETE — Departman sil
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || (session.role !== "HR" && session.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const { id } = await params;

        const existing = await prisma.department.findFirst({
            where: { id, tenantId: session.tenantId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Departman bulunamadı" }, { status: 404 });
        }

        await prisma.department.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Department delete error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
