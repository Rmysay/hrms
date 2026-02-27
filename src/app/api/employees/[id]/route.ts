import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET — Çalışan detayı
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

        const employee = await prisma.user.findFirst({
            where: { id, tenantId: session.tenantId },
            include: {
                department: { select: { id: true, name: true } },
                position: { select: { id: true, name: true } },
                manager: { select: { id: true, name: true } },
                subordinates: { select: { id: true, name: true, position: { select: { name: true } } } },
            },
        });

        if (!employee) {
            return NextResponse.json({ error: "Çalışan bulunamadı" }, { status: 404 });
        }

        return NextResponse.json({ employee });
    } catch (error) {
        console.error("Employee detail error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// PUT — Çalışan güncelle
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
        const body = await request.json();

        // Verify employee belongs to same tenant
        const existing = await prisma.user.findFirst({
            where: { id, tenantId: session.tenantId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Çalışan bulunamadı" }, { status: 404 });
        }

        const { name, email, phone, birthDate, startDate, departmentId, positionId, managerId, role, annualLeaveDays, isActive } = body;

        const employee = await prisma.user.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(email !== undefined && { email }),
                ...(phone !== undefined && { phone }),
                ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
                ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
                ...(departmentId !== undefined && { departmentId: departmentId || null }),
                ...(positionId !== undefined && { positionId: positionId || null }),
                ...(managerId !== undefined && { managerId: managerId || null }),
                ...(role !== undefined && { role }),
                ...(annualLeaveDays !== undefined && { annualLeaveDays }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                department: { select: { id: true, name: true } },
                position: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ employee });
    } catch (error) {
        console.error("Employee update error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
