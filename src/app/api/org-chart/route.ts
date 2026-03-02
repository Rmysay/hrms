import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface OrgNode {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
    position: string | null;
    children: OrgNode[];
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

        const tenantId = session.tenantId;

        const employees = await prisma.user.findMany({
            where: { tenantId, isActive: true },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                managerId: true,
                department: { select: { name: true } },
                position: { select: { name: true } },
            },
            orderBy: { name: "asc" },
        });

        // Build tree structure
        const nodeMap = new Map<string, OrgNode>();
        const rootNodes: OrgNode[] = [];

        // Create all nodes first
        for (const emp of employees) {
            nodeMap.set(emp.id, {
                id: emp.id,
                name: emp.name,
                email: emp.email,
                role: emp.role,
                department: emp.department?.name || null,
                position: emp.position?.name || null,
                children: [],
            });
        }

        // Link children to parents
        for (const emp of employees) {
            const node = nodeMap.get(emp.id)!;
            if (emp.managerId && nodeMap.has(emp.managerId)) {
                nodeMap.get(emp.managerId)!.children.push(node);
            } else {
                rootNodes.push(node);
            }
        }

        return NextResponse.json({
            tree: rootNodes,
            totalEmployees: employees.length,
        });
    } catch (error) {
        console.error("Org chart error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
