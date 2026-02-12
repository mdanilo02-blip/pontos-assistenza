import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AdminDashboard } from './_components/admin-dashboard';

export const dynamic = 'force-dynamic';

async function getDashboardMetrics() {
  const [totalShifts, totalProfessionals, pendingTrades, shiftsThisMonth] = await Promise.all([
    prisma.shift.count(),
    prisma.user.count({ where: { role: 'PROFISSIONAL' } }),
    prisma.tradeRequest.count({ where: { status: 'PENDENTE' } }),
    prisma.shift.count({
      where: {
        startDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      },
    }),
  ]);

  return { totalShifts, totalProfessionals, pendingTrades, shiftsThisMonth };
}

async function getRecentShifts() {
  return prisma.shift.findMany({
    take: 5,
    orderBy: { startDate: 'desc' },
    include: {
      hospital: true,
      user: true,
      group: true,
    },
  });
}

async function getPendingTrades() {
  return prisma.tradeRequest.findMany({
    where: { status: 'PENDENTE' },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      shift: {
        include: {
          hospital: true,
          group: true,
        },
      },
      requester: true,
      targetUser: true,
    },
  });
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const [metrics, recentShifts, pendingTrades] = await Promise.all([
    getDashboardMetrics(),
    getRecentShifts(),
    getPendingTrades(),
  ]);

  const serializedShifts = recentShifts.map(s => ({
    ...s,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    hospital: { ...s.hospital, createdAt: s.hospital.createdAt.toISOString(), updatedAt: s.hospital.updatedAt.toISOString() },
    user: { ...s.user, createdAt: s.user.createdAt.toISOString(), updatedAt: s.user.updatedAt.toISOString() },
    group: { ...s.group, createdAt: s.group.createdAt.toISOString(), updatedAt: s.group.updatedAt.toISOString() },
  }));

  const serializedTrades = pendingTrades.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    respondedAt: t.respondedAt?.toISOString() ?? null,
    shift: {
      ...t.shift,
      startDate: t.shift.startDate.toISOString(),
      endDate: t.shift.endDate.toISOString(),
      createdAt: t.shift.createdAt.toISOString(),
      updatedAt: t.shift.updatedAt.toISOString(),
      hospital: { ...t.shift.hospital, createdAt: t.shift.hospital.createdAt.toISOString(), updatedAt: t.shift.hospital.updatedAt.toISOString() },
      group: { ...t.shift.group, createdAt: t.shift.group.createdAt.toISOString(), updatedAt: t.shift.group.updatedAt.toISOString() },
    },
    requester: { ...t.requester, createdAt: t.requester.createdAt.toISOString(), updatedAt: t.requester.updatedAt.toISOString() },
    targetUser: { ...t.targetUser, createdAt: t.targetUser.createdAt.toISOString(), updatedAt: t.targetUser.updatedAt.toISOString() },
  }));

  return (
    <AdminDashboard
      metrics={metrics}
      recentShifts={serializedShifts}
      pendingTrades={serializedTrades}
      userName={session?.user?.name ?? 'Admin'}
    />
  );
}
