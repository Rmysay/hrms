import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// PATCH /api/notifications/[id] — Mark single notification as read
export async function PATCH(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

        const { id } = await params;
        const notification = await prisma.notification.findFirst({
            where: { id, userId: session.userId },
        });

        if (!notification) {
            return NextResponse.json({ error: "Bildirim bulunamadı" }, { status: 404 });
        }

        await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Notification read error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
