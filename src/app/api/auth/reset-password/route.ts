import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Token ve yeni şifre gerekli" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "Şifre en az 6 karakter olmalı" }, { status: 400 });
        }

        // Find user with valid token
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpiry: { gte: new Date() },
                isActive: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Geçersiz veya süresi dolmuş token. Lütfen tekrar şifre sıfırlama talebi gönderin." },
                { status: 400 }
            );
        }

        // Update password and clear reset token
        const passwordHash = await hashPassword(password);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                passwordResetToken: null,
                passwordResetExpiry: null,
            },
        });

        return NextResponse.json({ message: "Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz." });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
