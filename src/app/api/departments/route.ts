import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET — Departman listesi
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const departments = await prisma.department.findMany({
            where: { tenantId: session.tenantId },
            include: {
                manager: { select: { id: true, name: true } },
                _count: { select: { members: true, positions: true } },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ departments });
    } catch (error) {
        console.error("Departments list error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// POST — Yeni departman
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.role !== "HR" && session.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const { name, managerId } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Departman adı zorunludur" }, { status: 400 });
        }

        const existing = await prisma.department.findFirst({
            where: { name, tenantId: session.tenantId },
        });

        if (existing) {
            return NextResponse.json({ error: "Bu departman zaten mevcut" }, { status: 409 });
        }

        const department = await prisma.department.create({
            data: {
                tenantId: session.tenantId,
                name,
                managerId: managerId || null,
            },
            include: {
                manager: { select: { id: true, name: true } },
                _count: { select: { members: true, positions: true } },
            },
        });

        return NextResponse.json({ department }, { status: 201 });
    } catch (error) {
        console.error("Department create error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
