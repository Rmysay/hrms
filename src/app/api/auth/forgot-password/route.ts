import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "E-posta adresi gerekli" }, { status: 400 });
        }

        // Find user across all tenants
        const user = await prisma.user.findFirst({
            where: { email, isActive: true },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({ message: "Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi." });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpiry: resetExpiry,
            },
        });

        // In production, send email. For demo, log the token.
        console.log("=".repeat(60));
        console.log("ŞİFRE SIFIRLAMA TOKEN'I");
        console.log(`Kullanıcı: ${user.email}`);
        console.log(`Token: ${resetToken}`);
        console.log(`Reset URL: /reset-password?token=${resetToken}`);
        console.log("=".repeat(60));

        return NextResponse.json({
            message: "Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.",
            // DEV MODE: Include token in response for testing
            ...(process.env.NODE_ENV === "development" && { devToken: resetToken }),
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
