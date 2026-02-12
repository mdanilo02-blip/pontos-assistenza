import { PrismaClient } from '@prisma/client';
import { 
  Users, 
  Calendar, 
  Hospital, 
  ArrowUpRight, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminDashboard from './_components/admin-dashboard';

const prisma = new PrismaClient();

async function getStats() {
  const [userCount, hospitalCount, shiftCount, recentShifts] = await Promise.all([
    prisma.user.count(),
    prisma.hospital.count(),
    prisma.shift.count(),
    prisma.shift.findMany({
      take: 5,
      orderBy: { startDate: 'desc' },
      include: {
        user: true,
        hospital: true,
      },
    }),
  ]);

  // CORREÇÃO AQUI: Adicionado tipo (s: any) e tratamento de data
  const serializedShifts = (recentShifts || []).map((s: any) => ({
    ...s,
    startDate: s?.startDate instanceof Date ? s.startDate.toISOString() : s.startDate,
    endDate: s?.endDate instanceof Date ? s.endDate.toISOString() : s.endDate,
    createdAt: s?.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    updatedAt: s?.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
    user: s.user ? {
      ...s.user,
      createdAt: s.user.createdAt instanceof Date ? s.user.createdAt.toISOString() : s.user.createdAt,
      updatedAt: s.user.updatedAt instanceof Date ? s.user.updatedAt.toISOString() : s.user.updatedAt,
    } : null,
    hospital: s.hospital ? {
      ...s.hospital,
      createdAt: s.hospital.createdAt instanceof Date ? s.hospital.createdAt.toISOString() : s.hospital.createdAt,
      updatedAt: s.hospital.updatedAt instanceof Date ? s.hospital.updatedAt.toISOString() : s.hospital.updatedAt,
    } : null,
  }));

  return {
    userCount,
    hospitalCount,
    shiftCount,
    recentShifts: serializedShifts,
  };
}

export default async function AdminPage() {
  const stats = await getStats();

  const cards = [
    {
      title: 'Total de Usuários',
      value: stats.userCount,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Hospitais',
      value: stats.hospitalCount,
      icon: Hospital,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Total de Plantões',
      value: stats.shiftCount,
      icon: Calendar,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Bem-vindo ao painel administrativo</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {card.title}
              </CardTitle>
              <div className={`${card.bg} p-2 rounded-lg`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-sky-500" />
              Plantões Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentShifts.map((shift: any) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{shift.user?.name || 'Profissional'}</p>
                      <p className="text-sm text-gray-500">{shift.hospital?.name || 'Hospital'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(shift.startDate).toLocaleDateString('pt-BR')}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      shift.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' : 
                      shift.status === 'CANCELADO' ? 'bg-red-100 text-red-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {shift.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <AdminDashboard />
      </div>
    </div>
  );
}