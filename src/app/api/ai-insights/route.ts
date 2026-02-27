import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface Insight {
    id: string;
    category: "performance" | "risk" | "development" | "engagement" | "workload";
    severity: "low" | "medium" | "high";
    title: string;
    description: string;
    recommendation: string;
    affectedEmployees: { id: string; name: string }[];
    metric?: string;
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        if (session.role === "EMPLOYEE") return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

        const tenantId = session.tenantId;

        // Gather all necessary data
        const [employees, tasks, leaves, testResults, nineBoxEvals] = await Promise.all([
            prisma.user.findMany({
                where: { tenantId, role: "EMPLOYEE" },
                select: { id: true, name: true, isActive: true, department: { select: { name: true } } },
            }),
            prisma.task.findMany({
                where: { tenantId },
                select: { id: true, title: true, status: true, priority: true, assignedToId: true, dueDate: true, assignedTo: { select: { id: true, name: true } } },
            }),
            prisma.leaveRequest.findMany({
                where: { tenantId },
                select: { id: true, userId: true, status: true, leaveType: true, startDate: true, endDate: true, user: { select: { id: true, name: true } } },
            }),
            prisma.testResult.findMany({
                where: { test: { tenantId } },
                select: { id: true, userId: true, score: true, user: { select: { id: true, name: true } } },
            }),
            prisma.nineBoxEvaluation.findMany({
                where: { tenantId },
                select: { id: true, userId: true, performanceScore: true, potentialScore: true, user: { select: { id: true, name: true } } },
                orderBy: { evaluatedAt: "desc" },
            }),
        ]);

        const insights: Insight[] = [];
        let insightId = 1;

        // === 1. OVERDUE TASK ANALYSIS ===
        const now = new Date();
        const overdueTasks = tasks.filter(
            (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED" && t.status !== "CANCELLED"
        );
        if (overdueTasks.length > 0) {
            const affected = [...new Map(overdueTasks.filter(t => t.assignedTo).map((t) => [t.assignedTo!.id, t.assignedTo!])).values()];
            insights.push({
                id: `insight-${insightId++}`,
                category: "workload",
                severity: overdueTasks.length > 3 ? "high" : "medium",
                title: `${overdueTasks.length} görev son tarihini geçmiş`,
                description: `Toplam ${overdueTasks.length} görev belirlenen son tarihi aşmış durumda. Bu durum proje akışlarını olumsuz etkileyebilir.`,
                recommendation: "Geciken görevleri öncelik sırasına göre gözden geçirin. İlgili çalışanlarla birebir görüşme yaparak engelleri belirleyin ve destek sağlayın.",
                affectedEmployees: affected,
                metric: `${overdueTasks.length} gecikmiş görev`,
            });
        }

        // === 2. HIGH PRIORITY TASK ACCUMULATION ===
        const highPriorityPendingTasks = tasks.filter(
            (t) => t.priority === "HIGH" && (t.status === "PENDING" || t.status === "IN_PROGRESS")
        );
        const employeeHighTaskCount = new Map<string, { count: number; employee: { id: string; name: string } }>();
        for (const t of highPriorityPendingTasks) {
            if (t.assignedTo) {
                const existing = employeeHighTaskCount.get(t.assignedTo.id);
                if (existing) existing.count++;
                else employeeHighTaskCount.set(t.assignedTo.id, { count: 1, employee: t.assignedTo });
            }
        }
        const overloadedEmployees = [...employeeHighTaskCount.values()].filter((v) => v.count >= 2);
        if (overloadedEmployees.length > 0) {
            insights.push({
                id: `insight-${insightId++}`,
                category: "workload",
                severity: "high",
                title: "Yüksek öncelikli görev yoğunluğu tespit edildi",
                description: `${overloadedEmployees.length} çalışanda 2 veya daha fazla yüksek öncelikli görev birikmiş durumda. Bu durum tükenmişlik riskini artırabilir.`,
                recommendation: "Görevlerin dengeli dağılımını sağlamak için iş yükü analizi yapın. Mümkünse bazı görevleri diğer ekip üyelerine devredin.",
                affectedEmployees: overloadedEmployees.map((v) => v.employee),
                metric: `${overloadedEmployees.length} çalışan`,
            });
        }

        // === 3. PENDING LEAVE REQUEST ALERT ===
        const pendingLeaves = leaves.filter((l) => l.status === "PENDING");
        if (pendingLeaves.length > 0) {
            const affected = [...new Map(pendingLeaves.map((l) => [l.user.id, l.user])).values()];
            insights.push({
                id: `insight-${insightId++}`,
                category: "engagement",
                severity: pendingLeaves.length > 5 ? "high" : "medium",
                title: `${pendingLeaves.length} bekleyen izin talebi`,
                description: `Onay bekleyen izin talepleri çalışan memnuniyetini etkileyebilir. Gecikmeli onay süreci motivasyonu düşürebilir.`,
                recommendation: "Bekleyen izin taleplerini en kısa sürede değerlendirin. Tekrarlayan gecikmeler varsa onay sürecini iyileştirin.",
                affectedEmployees: affected,
                metric: `${pendingLeaves.length} bekleyen talep`,
            });
        }

        // === 4. FREQUENT LEAVE PATTERN ===
        const leaveCountByUser = new Map<string, { count: number; user: { id: string; name: string } }>();
        for (const l of leaves) {
            const existing = leaveCountByUser.get(l.userId);
            if (existing) existing.count++;
            else leaveCountByUser.set(l.userId, { count: 1, user: l.user });
        }
        const frequentLeaveUsers = [...leaveCountByUser.values()].filter((v) => v.count >= 3);
        if (frequentLeaveUsers.length > 0) {
            insights.push({
                id: `insight-${insightId++}`,
                category: "risk",
                severity: "medium",
                title: "Sık izin kullanım paterni tespit edildi",
                description: `${frequentLeaveUsers.length} çalışan son dönemde yüksek sıklıkta izin talep etmiş. Bu bir tükenmişlik veya motivasyon kaybı göstergesi olabilir.`,
                recommendation: "İlgili çalışanlarla bire bir görüşme yaparak iş-yaşam dengesini değerlendirin. Gerekirse esnek çalışma modelleri önerin.",
                affectedEmployees: frequentLeaveUsers.map((v) => v.user),
                metric: `${frequentLeaveUsers.length} çalışan`,
            });
        }

        // === 5. LOW TEST SCORES ===
        const lowScoreResults = testResults.filter((r) => r.score < 50);
        if (lowScoreResults.length > 0) {
            const affected = [...new Map(lowScoreResults.map((r) => [r.user.id, r.user])).values()];
            insights.push({
                id: `insight-${insightId++}`,
                category: "development",
                severity: lowScoreResults.length > 3 ? "high" : "medium",
                title: `${lowScoreResults.length} düşük test sonucu`,
                description: `Test sonuçları %50'nin altında kalan çalışanlar tespit edildi. Bu durum yetkinlik açığına işaret edebilir.`,
                recommendation: "Düşük puan alan çalışanlar için kişisel gelişim planı oluşturun. Hedefli eğitim programları ve mentorluk desteği sağlayın.",
                affectedEmployees: affected,
                metric: `Ort. puan: ${Math.round(lowScoreResults.reduce((a, r) => a + r.score, 0) / lowScoreResults.length)}%`,
            });
        }

        // === 6. UNTESTED EMPLOYEES ===
        const testedUserIds = new Set(testResults.map((r) => r.userId));
        const untestedEmployees = employees.filter((e) => e.isActive && !testedUserIds.has(e.id));
        if (untestedEmployees.length > 0 && testResults.length > 0) {
            insights.push({
                id: `insight-${insightId++}`,
                category: "development",
                severity: "low",
                title: `${untestedEmployees.length} çalışan henüz test çözmemiş`,
                description: `Aktif çalışanların bir kısmı henüz hiçbir değerlendirme testine katılmamış. Yetkinlik seviyesi bilinmiyor.`,
                recommendation: "Değerlendirilmemiş çalışanlara uygun testler atayın. Yetkinlik haritasını tamamlamak, etkili kariyer planlaması için kritik öneme sahiptir.",
                affectedEmployees: untestedEmployees.map((e) => ({ id: e.id, name: e.name })),
            });
        }

        // === 7. NINE-BOX HIGH POTENTIAL / LOW PERFORMANCE ===
        const latestEvalByUser = new Map<string, typeof nineBoxEvals[0]>();
        for (const ev of nineBoxEvals) {
            if (!latestEvalByUser.has(ev.userId)) latestEvalByUser.set(ev.userId, ev);
        }
        const puzzleEmployees = [...latestEvalByUser.values()].filter(
            (ev) => ev.potentialScore >= 2 && ev.performanceScore <= 1
        );
        if (puzzleEmployees.length > 0) {
            insights.push({
                id: `insight-${insightId++}`,
                category: "performance",
                severity: "high",
                title: "Yüksek potansiyelli ama düşük performanslı çalışanlar",
                description: `${puzzleEmployees.length} çalışan 9-Box değerlendirmesinde yüksek potansiyel ancak düşük performans gösteriyor. Bu "Bilmece" profili, doğru yönlendirmeyle yıldız çalışana dönüşebilir.`,
                recommendation: "Bu çalışanlarla kariyer gelişim görüşmeleri yapın. Yeteneklerini doğru alanlara yönlendirmek için görev rotasyonu veya mentorluk programı uygulayın.",
                affectedEmployees: puzzleEmployees.map((ev) => ev.user),
            });
        }

        // === 8. STAR EMPLOYEES ===
        const starEmployees = [...latestEvalByUser.values()].filter(
            (ev) => ev.potentialScore === 3 && ev.performanceScore === 3
        );
        if (starEmployees.length > 0) {
            insights.push({
                id: `insight-${insightId++}`,
                category: "performance",
                severity: "low",
                title: `${starEmployees.length} yıldız çalışan tespit edildi`,
                description: `9-Box değerlendirmesinde hem yüksek performans hem yüksek potansiyel gösteren çalışanlar var. Bu çalışanlar organizasyonun en değerli kaynakları.`,
                recommendation: "Yıldız çalışanları elde tutmak için kariyer yolu planları oluşturun. Liderlik gelişim programlarına dahil edin ve rekabetçi ücretlendirme sunun.",
                affectedEmployees: starEmployees.map((ev) => ev.user),
            });
        }

        // === 9. RISK EMPLOYEES (low-low in 9-box) ===
        const riskEmployees = [...latestEvalByUser.values()].filter(
            (ev) => ev.potentialScore === 1 && ev.performanceScore === 1
        );
        if (riskEmployees.length > 0) {
            insights.push({
                id: `insight-${insightId++}`,
                category: "risk",
                severity: "high",
                title: `${riskEmployees.length} riskli çalışan profili`,
                description: `9-Box değerlendirmesinde düşük performans ve düşük potansiyel gösteren çalışanlar tespit edildi. Acil müdahale gerekebilir.`,
                recommendation: "Performans iyileştirme planı (PIP) başlatın. Net hedefler belirleyin ve düzenli geri bildirim seansları planlayın. Gelişim gösteremeyen durumları ayrılık sürecine hazırlayın.",
                affectedEmployees: riskEmployees.map((ev) => ev.user),
            });
        }

        // === 10. TASK COMPLETION RATE ===
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        if (totalTasks > 0 && completionRate < 50) {
            insights.push({
                id: `insight-${insightId++}`,
                category: "performance",
                severity: "medium",
                title: "Düşük görev tamamlanma oranı",
                description: `Genel görev tamamlanma oranı %${completionRate}. Organizasyonel verimlilik hedefinin altında kalabilir.`,
                recommendation: "Görev planlama süreçlerini gözden geçirin. Gerçekçi teslim tarihleri belirleyin ve görev takip mekanizmalarını güçlendirin.",
                affectedEmployees: [],
                metric: `%${completionRate} tamamlanma`,
            });
        }

        // === 11. NO TASKS ASSIGNED ===
        const assignedUserIds = new Set(tasks.filter(t => t.assignedToId).map((t) => t.assignedToId!));
        const unassignedEmployees = employees.filter((e) => e.isActive && !assignedUserIds.has(e.id));
        if (unassignedEmployees.length > 0 && tasks.length > 0) {
            insights.push({
                id: `insight-${insightId++}`,
                category: "workload",
                severity: "low",
                title: `${unassignedEmployees.length} çalışana görev atanmamış`,
                description: `Aktif çalışanların bir kısmının hiçbir görevi bulunmuyor. Kaynak kullanımı optimize edilebilir.`,
                recommendation: "İş yükü dağılımını yeniden değerlendirin. Görev planlamalarında bu çalışanları da dahil edin.",
                affectedEmployees: unassignedEmployees.map((e) => ({ id: e.id, name: e.name })),
            });
        }

        // Sort by severity: high > medium > low
        const severityOrder = { high: 0, medium: 1, low: 2 };
        insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        // Summary stats
        const summary = {
            totalInsights: insights.length,
            highSeverity: insights.filter((i) => i.severity === "high").length,
            mediumSeverity: insights.filter((i) => i.severity === "medium").length,
            lowSeverity: insights.filter((i) => i.severity === "low").length,
            categories: {
                performance: insights.filter((i) => i.category === "performance").length,
                risk: insights.filter((i) => i.category === "risk").length,
                development: insights.filter((i) => i.category === "development").length,
                engagement: insights.filter((i) => i.category === "engagement").length,
                workload: insights.filter((i) => i.category === "workload").length,
            },
        };

        return NextResponse.json({ insights, summary });
    } catch (error) {
        console.error("AI Insights error:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
