import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                tenant: { select: { id: true, name: true, slug: true, logoUrl: true } },
            },
        });

        if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

        const body = await request.json();
        const { action } = body;

        if (action === "update-profile") {
            const { name, phone } = body;
            await prisma.user.update({
                where: { id: session.userId },
                data: { name, phone },
            });
            return NextResponse.json({ message: "Profil güncellendi" });
        }

        if (action === "change-password") {
            const { currentPassword, newPassword } = body;

            if (!currentPassword || !newPassword) {
                return NextResponse.json({ error: "Mevcut ve yeni şifre gerekli" }, { status: 400 });
            }

            if (newPassword.length < 6) {
                return NextResponse.json({ error: "Yeni şifre en az 6 karakter olmalı" }, { status: 400 });
            }

            const user = await prisma.user.findUnique({
                where: { id: session.userId },
                select: { passwordHash: true },
            });

            if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

            const isValid = await verifyPassword(currentPassword, user.passwordHash);
            if (!isValid) {
                return NextResponse.json({ error: "Mevcut şifre yanlış" }, { status: 400 });
            }

            const passwordHash = await hashPassword(newPassword);
            await prisma.user.update({
                where: { id: session.userId },
                data: { passwordHash },
            });

            return NextResponse.json({ message: "Şifre güncellendi" });
        }

        if (action === "update-tenant" && session.role !== "EMPLOYEE") {
            const { tenantName } = body;
            await prisma.tenant.update({
                where: { id: session.tenantId },
                data: { name: tenantName },
            });
            return NextResponse.json({ message: "Şirket bilgileri güncellendi" });
        }

        return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
    } catch (error) {
        console.error("Settings PUT error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
