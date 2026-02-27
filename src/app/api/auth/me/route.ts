import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tenantId: true,
                isActive: true,
                department: { select: { id: true, name: true } },
                position: { select: { id: true, name: true } },
                tenant: { select: { id: true, name: true, slug: true, logoUrl: true } },
            },
        });

        if (!user || !user.isActive) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Session check error:", error);
        return NextResponse.json({ user: null }, { status: 500 });
    }
}
