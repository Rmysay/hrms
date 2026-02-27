import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createToken, setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const { email, password, tenantSlug } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email ve şifre zorunludur" },
                { status: 400 }
            );
        }

        // Find user (if tenantSlug provided, filter by tenant)
        const whereClause: Record<string, unknown> = { email };
        if (tenantSlug) {
            const tenant = await prisma.tenant.findUnique({
                where: { slug: tenantSlug },
            });
            if (!tenant) {
                return NextResponse.json(
                    { error: "Şirket bulunamadı" },
                    { status: 404 }
                );
            }
            whereClause.tenantId = tenant.id;
        }

        const user = await prisma.user.findFirst({
            where: whereClause,
            include: { tenant: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Geçersiz email veya şifre" },
                { status: 401 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: "Hesabınız pasif durumdadır" },
                { status: 403 }
            );
        }

        if (!user.tenant.isActive) {
            return NextResponse.json(
                { error: "Şirket hesabı pasif durumdadır" },
                { status: 403 }
            );
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json(
                { error: "Geçersiz email veya şifre" },
                { status: 401 }
            );
        }

        const token = await createToken({
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
            email: user.email,
            name: user.name,
        });

        await setSession(token);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
                tenantName: user.tenant.name,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Giriş sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}
