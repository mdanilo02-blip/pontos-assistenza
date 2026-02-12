'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  ArrowLeftRight,
  TrendingUp,
  Clock,
  Building2,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClientTime } from '@/components/ui/client-time';

interface DashboardMetrics {
  totalShifts: number;
  totalProfessionals: number;
  pendingTrades: number;
  shiftsThisMonth: number;
}

interface AdminDashboardProps {
  metrics: DashboardMetrics;
  recentShifts: any[];
  pendingTrades: any[];
  userName: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function AdminDashboard({ metrics, recentShifts, pendingTrades, userName }: AdminDashboardProps) {
  const metricCards = [
    {
      title: 'Total de Plantões',
      value: metrics?.totalShifts ?? 0,
      icon: Calendar,
      color: 'bg-sky-500',
      href: '/admin/shifts',
    },
    {
      title: 'Profissionais',
      value: metrics?.totalProfessionals ?? 0,
      icon: Users,
      color: 'bg-teal-500',
      href: '/admin/users',
    },
    {
      title: 'Trocas Pendentes',
      value: metrics?.pendingTrades ?? 0,
      icon: ArrowLeftRight,
      color: 'bg-amber-500',
      href: '/admin/trades',
    },
    {
      title: 'Plantões este Mês',
      value: metrics?.shiftsThisMonth ?? 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
      href: '/admin/shifts',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">Olá, {userName}!</h1>
        <p className="text-gray-500">Bem-vindo ao painel administrativo</p>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div key={metric.title} variants={itemVariants}>
              <Link href={metric.href}>
                <Card className="cursor-pointer hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{metric.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                      </div>
                      <div className={`w-10 h-10 ${metric.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Shifts */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Plantões Recentes</CardTitle>
              <Link href="/admin/shifts">
                <Button variant="ghost" size="sm">
                  Ver todos
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {(recentShifts?.length ?? 0) === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  Nenhum plantão cadastrado
                </p>
              ) : (
                <div className="space-y-3">
                  {recentShifts?.map?.((shift: any) => (
                    <div
                      key={shift?.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {shift?.user?.name ?? 'Profissional'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {shift?.hospital?.name ?? 'Hospital'} • {shift?.group?.name ?? 'Grupo'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          <ClientTime date={shift?.startDate} formatStr="dd/MM" />
                        </p>
                        <p className="text-xs text-gray-500">
                          <ClientTime date={shift?.startDate} />
                        </p>
                      </div>
                    </div>
                  )) ?? []}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Trades */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Trocas Pendentes</CardTitle>
              <Link href="/admin/trades">
                <Button variant="ghost" size="sm">
                  Ver todas
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {(pendingTrades?.length ?? 0) === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  Nenhuma troca pendente
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingTrades?.map?.((trade: any) => (
                    <div
                      key={trade?.id}
                      className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100"
                    >
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <ArrowLeftRight className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">
                          {trade?.requester?.name ?? 'Solicitante'} → {trade?.targetUser?.name ?? 'Destino'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {trade?.shift?.hospital?.name ?? 'Hospital'} •{' '}
                          {trade?.shift?.startDate ? format(new Date(trade.shift.startDate), 'dd/MM/yyyy') : '--'}
                        </p>
                      </div>
                      <Badge variant="warning">Pendente</Badge>
                    </div>
                  )) ?? []}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
