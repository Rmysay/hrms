import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seed başlatılıyor...");

    // Tenant oluştur
    const tenant = await prisma.tenant.upsert({
        where: { slug: "demo-sirket" },
        update: {},
        create: {
            name: "Demo Şirket A.Ş.",
            slug: "demo-sirket",
            isActive: true,
        },
    });
    console.log("✅ Tenant oluşturuldu:", tenant.name);

    // Departmanlar
    const departments = await Promise.all([
        prisma.department.create({ data: { tenantId: tenant.id, name: "Yazılım Geliştirme" } }),
        prisma.department.create({ data: { tenantId: tenant.id, name: "İnsan Kaynakları" } }),
        prisma.department.create({ data: { tenantId: tenant.id, name: "Pazarlama" } }),
        prisma.department.create({ data: { tenantId: tenant.id, name: "Finans" } }),
    ]);
    console.log("✅ Departmanlar oluşturuldu:", departments.length);

    // Pozisyonlar
    const positions = await Promise.all([
        prisma.position.create({ data: { tenantId: tenant.id, departmentId: departments[0].id, name: "Junior Developer", level: 1 } }),
        prisma.position.create({ data: { tenantId: tenant.id, departmentId: departments[0].id, name: "Senior Developer", level: 2 } }),
        prisma.position.create({ data: { tenantId: tenant.id, departmentId: departments[0].id, name: "Team Lead", level: 3 } }),
        prisma.position.create({ data: { tenantId: tenant.id, departmentId: departments[1].id, name: "İK Uzmanı", level: 1 } }),
        prisma.position.create({ data: { tenantId: tenant.id, departmentId: departments[1].id, name: "İK Müdürü", level: 3 } }),
        prisma.position.create({ data: { tenantId: tenant.id, departmentId: departments[2].id, name: "Pazarlama Uzmanı", level: 1 } }),
        prisma.position.create({ data: { tenantId: tenant.id, departmentId: departments[3].id, name: "Muhasebe Uzmanı", level: 1 } }),
    ]);
    console.log("✅ Pozisyonlar oluşturuldu:", positions.length);

    const passwordHash = await bcrypt.hash("123456", 12);

    // HR Kullanıcısı
    const hrUser = await prisma.user.create({
        data: {
            tenantId: tenant.id, name: "Ayşe Yılmaz", email: "hr@demo.com", passwordHash,
            role: "HR", departmentId: departments[1].id, positionId: positions[4].id,
            annualLeaveDays: 14, startDate: new Date("2023-01-15"),
        },
    });
    console.log("✅ HR kullanıcısı oluşturuldu:", hrUser.email);

    // Çalışanlar
    const employees = await Promise.all([
        prisma.user.create({
            data: {
                tenantId: tenant.id, name: "Mehmet Kaya", email: "mehmet@demo.com", passwordHash,
                role: "EMPLOYEE", departmentId: departments[0].id, positionId: positions[2].id,
                managerId: hrUser.id, annualLeaveDays: 14, startDate: new Date("2023-03-01"),
            }
        }),
        prisma.user.create({
            data: {
                tenantId: tenant.id, name: "Fatma Demir", email: "fatma@demo.com", passwordHash,
                role: "EMPLOYEE", departmentId: departments[0].id, positionId: positions[1].id,
                annualLeaveDays: 14, startDate: new Date("2023-06-15"),
            }
        }),
        prisma.user.create({
            data: {
                tenantId: tenant.id, name: "Ali Öztürk", email: "ali@demo.com", passwordHash,
                role: "EMPLOYEE", departmentId: departments[0].id, positionId: positions[0].id,
                annualLeaveDays: 14, startDate: new Date("2024-01-10"),
            }
        }),
        prisma.user.create({
            data: {
                tenantId: tenant.id, name: "Zeynep Çelik", email: "zeynep@demo.com", passwordHash,
                role: "EMPLOYEE", departmentId: departments[2].id, positionId: positions[5].id,
                annualLeaveDays: 14, startDate: new Date("2023-09-01"),
            }
        }),
        prisma.user.create({
            data: {
                tenantId: tenant.id, name: "Can Yıldız", email: "can@demo.com", passwordHash,
                role: "EMPLOYEE", departmentId: departments[3].id, positionId: positions[6].id,
                annualLeaveDays: 14, startDate: new Date("2024-02-20"),
            }
        }),
    ]);

    await prisma.user.update({ where: { id: employees[1].id }, data: { managerId: employees[0].id } });
    await prisma.user.update({ where: { id: employees[2].id }, data: { managerId: employees[0].id } });

    console.log("✅ Çalışanlar oluşturuldu:", employees.length);
    console.log("\n🎉 Seed tamamlandı!");
    console.log("📧 HR Girişi: hr@demo.com / 123456");
    console.log("📧 Çalışan Girişi: mehmet@demo.com / 123456");
}

main()
    .catch((e) => { console.error("❌ Seed hatası:", e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
