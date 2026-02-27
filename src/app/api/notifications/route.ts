import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/notifications
export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

        const notifications = await prisma.notification.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: session.userId, isRead: false },
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Notifications list error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// POST /api/notifications — Create notification (internal use)
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        if (session.role === "EMPLOYEE") return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

        const body = await request.json();
        const { userId, type, title, message } = body;

        if (!userId || !type || !title || !message) {
            return NextResponse.json({ error: "Tüm alanlar zorunludur" }, { status: 400 });
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                tenantId: session.tenantId,
                type,
                title,
                message,
            },
        });

        return NextResponse.json({ notification }, { status: 201 });
    } catch (error) {
        console.error("Notification create error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// PATCH /api/notifications — Mark all as read
export async function PATCH() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

        await prisma.notification.updateMany({
            where: { userId: session.userId, isRead: false },
            data: { isRead: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Notifications mark read error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
