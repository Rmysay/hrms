import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const tenantId = session.tenantId;
        const isEmployee = session.role === "EMPLOYEE";

        const [
            totalEmployees,
            activeEmployees,
            departments,
            pendingLeaves,
            approvedLeaves,
            rejectedLeaves,
            activeTasks,
            completedTasks,
            totalTasks,
            activeTests,
            testResults,
            unreadNotifications,
            nineBoxCount,
            recentLeaves,
            recentTasks,
        ] = await Promise.all([
            prisma.user.count({ where: { tenantId, role: "EMPLOYEE" } }),
            prisma.user.count({ where: { tenantId, role: "EMPLOYEE", isActive: true } }),
            prisma.department.count({ where: { tenantId } }),
            prisma.leaveRequest.count({
                where: isEmployee
                    ? { tenantId, userId: session.userId, status: "PENDING" }
                    : { tenantId, status: "PENDING" },
            }),
            prisma.leaveRequest.count({
                where: isEmployee
                    ? { tenantId, userId: session.userId, status: "APPROVED" }
                    : { tenantId, status: "APPROVED" },
            }),
            prisma.leaveRequest.count({
                where: isEmployee
                    ? { tenantId, userId: session.userId, status: "REJECTED" }
                    : { tenantId, status: "REJECTED" },
            }),
            prisma.task.count({
                where: isEmployee
                    ? { tenantId, assignedToId: session.userId, status: { in: ["PENDING", "IN_PROGRESS"] } }
                    : { tenantId, status: { in: ["PENDING", "IN_PROGRESS"] } },
            }),
            prisma.task.count({
                where: isEmployee
                    ? { tenantId, assignedToId: session.userId, status: "COMPLETED" }
                    : { tenantId, status: "COMPLETED" },
            }),
            prisma.task.count({
                where: isEmployee
                    ? { tenantId, assignedToId: session.userId }
                    : { tenantId },
            }),
            prisma.test.count({ where: { tenantId, isActive: true } }),
            prisma.testResult.count({
                where: isEmployee
                    ? { userId: session.userId }
                    : { test: { tenantId } },
            }),
            prisma.notification.count({ where: { userId: session.userId, isRead: false } }),
            prisma.nineBoxEvaluation.count({ where: { tenantId } }),
            prisma.leaveRequest.findMany({
                where: isEmployee ? { tenantId, userId: session.userId } : { tenantId },
                take: 5,
                orderBy: { createdAt: "desc" },
                select: { id: true, leaveType: true, status: true, startDate: true, endDate: true, user: { select: { name: true } } },
            }),
            prisma.task.findMany({
                where: isEmployee ? { tenantId, assignedToId: session.userId } : { tenantId },
                take: 5,
                orderBy: { createdAt: "desc" },
                select: { id: true, title: true, status: true, priority: true, assignedTo: { select: { name: true } } },
            }),
        ]);

        return NextResponse.json({
            totalEmployees,
            activeEmployees,
            departments,
            pendingLeaves,
            approvedLeaves,
            rejectedLeaves,
            activeTasks,
            completedTasks,
            totalTasks,
            activeTests,
            testResults,
            unreadNotifications,
            nineBoxCount,
            recentLeaves,
            recentTasks,
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
