import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

// GET — Çalışan listesi (filtreli)
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.role !== "HR" && session.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const departmentId = searchParams.get("departmentId");
        const positionId = searchParams.get("positionId");
        const status = searchParams.get("status");

        const where: Record<string, unknown> = {
            tenantId: session.tenantId,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }
        if (departmentId) where.departmentId = departmentId;
        if (positionId) where.positionId = positionId;
        if (status === "active") where.isActive = true;
        if (status === "inactive") where.isActive = false;

        const employees = await prisma.user.findMany({
            where,
            include: {
                department: { select: { id: true, name: true } },
                position: { select: { id: true, name: true } },
                manager: { select: { id: true, name: true } },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ employees });
    } catch (error) {
        console.error("Employees list error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// POST — Yeni çalışan ekle
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.role !== "HR" && session.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const body = await request.json();
        const { name, email, password, phone, birthDate, startDate, departmentId, positionId, managerId, role, annualLeaveDays } = body;

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Ad, email ve şifre zorunludur" },
                { status: 400 }
            );
        }

        // Check for existing email in same tenant
        const existing = await prisma.user.findFirst({
            where: { email, tenantId: session.tenantId },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Bu email adresi zaten kayıtlı" },
                { status: 409 }
            );
        }

        const passwordHash = await hashPassword(password);

        const employee = await prisma.user.create({
            data: {
                tenantId: session.tenantId,
                name,
                email,
                passwordHash,
                phone: phone || null,
                birthDate: birthDate ? new Date(birthDate) : null,
                startDate: startDate ? new Date(startDate) : null,
                departmentId: departmentId || null,
                positionId: positionId || null,
                managerId: managerId || null,
                role: role || "EMPLOYEE",
                annualLeaveDays: annualLeaveDays || 14,
            },
            include: {
                department: { select: { id: true, name: true } },
                position: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ employee }, { status: 201 });
    } catch (error) {
        console.error("Employee create error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
