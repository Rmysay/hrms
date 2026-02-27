import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET — Pozisyon listesi
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const departmentId = searchParams.get("departmentId");

        const where: Record<string, unknown> = { tenantId: session.tenantId };
        if (departmentId) where.departmentId = departmentId;

        const positions = await prisma.position.findMany({
            where,
            include: {
                department: { select: { id: true, name: true } },
                _count: { select: { users: true } },
            },
            orderBy: [{ department: { name: "asc" } }, { level: "asc" }],
        });

        return NextResponse.json({ positions });
    } catch (error) {
        console.error("Positions list error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// POST — Yeni pozisyon
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.role !== "HR" && session.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const { name, departmentId, level } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Pozisyon adı zorunludur" }, { status: 400 });
        }

        const position = await prisma.position.create({
            data: {
                tenantId: session.tenantId,
                name,
                departmentId: departmentId || null,
                level: level || 1,
            },
            include: {
                department: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ position }, { status: 201 });
    } catch (error) {
        console.error("Position create error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
