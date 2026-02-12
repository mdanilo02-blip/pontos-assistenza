import { PrismaClient } from '@prisma/client';
import { AdminDashboard } from './_components/admin-dashboard';

const prisma = new PrismaClient();

async function getStats() {
  // datas para o mês atual
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    userCount,
    hospitalCount,
    shiftCount,
    shiftsThisMonth,
    recentShiftsRaw,
  ] = await Promise.all([
    // total de usuários (pode incluir admins — ajuste se quiser filtrar)
    prisma.user.count(),
    prisma.hospital.count(),
    prisma.shift.count(),
    prisma.shift.count({
      where: {
        startDate: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth,
        },
      },
    }),
    // últimos 5 plantões com relações
    prisma.shift.findMany({
      take: 5,
      orderBy: { startDate: 'desc' },
      include: {
        user: true,
        hospital: true,
        group: true,
      },
    }),
  ]);

  // serializar datas (para evitar problemas ao passar objetos Date do servidor para o client)
  const recentShifts = (recentShiftsRaw || []).map((s: any) => ({
    ...s,
    startDate: s?.startDate instanceof Date ? s.startDate.toISOString() : s?.startDate ?? null,
    endDate: s?.endDate instanceof Date ? s.endDate.toISOString() : s?.endDate ?? null,
    createdAt: s?.createdAt instanceof Date ? s.createdAt.toISOString() : s?.createdAt ?? null,
    updatedAt: s?.updatedAt instanceof Date ? s.updatedAt.toISOString() : s?.updatedAt ?? null,
    user: s.user
      ? {
          ...s.user,
          createdAt: s.user.createdAt instanceof Date ? s.user.createdAt.toISOString() : s.user.createdAt,
          updatedAt: s.user.updatedAt instanceof Date ? s.user.updatedAt.toISOString() : s.user.updatedAt,
        }
      : null,
    hospital: s.hospital
      ? {
          ...s.hospital,
          createdAt:
            s.hospital.createdAt instanceof Date ? s.hospital.createdAt.toISOString() : s.hospital.createdAt,
          updatedAt:
            s.hospital.updatedAt instanceof Date ? s.hospital.updatedAt.toISOString() : s.hospital.updatedAt,
        }
      : null,
  }));

  const metrics = {
    totalShifts: shiftCount,
    totalProfessionals: userCount,
    pendingTrades: 0, // se tiver modelo de trocas, substitua com a query apropriada
    shiftsThisMonth,
  };

  // pendingTrades array — vazio por enquanto; ajuste se houver modelo "trade"
  const pendingTrades: any[] = [];

  // userName: placeholder (se você integrar auth, substitua pelo nome do usuário logado)
  const userName = 'Administrador';

  return { metrics, recentShifts, pendingTrades, userName };
}

export default async function AdminPage() {
  const { metrics, recentShifts, pendingTrades, userName } = await getStats();

  return (
    <div className="space-y-8">
      <AdminDashboard
        metrics={metrics}
        recentShifts={recentShifts}
        pendingTrades={pendingTrades}
        userName={userName}
      />
    </div>
  );
}