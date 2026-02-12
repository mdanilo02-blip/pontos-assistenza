'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  ArrowLeftRight,
  Check,
  X,
  Clock,
  Building2,
  Calendar,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClientTime } from '@/components/ui/client-time';

const statusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' }> = {
  PENDENTE: { label: 'Pendente', variant: 'warning' },
  APROVADO: { label: 'Aprovado', variant: 'success' },
  RECUSADO: { label: 'Recusado', variant: 'destructive' },
};

export default function TradesPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTrades();
  }, [filter]);

  const fetchTrades = async () => {
    try {
      const url = filter ? `/api/trades?status=${filter}` : '/api/trades';
      const res = await fetch(url);
      const data = await res.json();
      setTrades(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (trade: any) => {
    setSelectedTrade(trade);
    setAdminNotes('');
    setModalOpen(true);
  };

  const handleAction = async (status: 'APROVADO' | 'RECUSADO') => {
    if (!selectedTrade) return;
    setProcessing(true);

    try {
      const res = await fetch(`/api/trades/${selectedTrade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchTrades();
      } else {
        const error = await res.json();
        alert(error?.error ?? 'Erro ao processar');
      }
    } catch (error) {
      console.error('Error processing trade:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight className="h-7 w-7 text-sky-500" />
            Solicitações de Troca
          </h1>
          <p className="text-gray-500 text-sm">Aprove ou recuse solicitações de troca de plantões</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={filter === '' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('')}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'PENDENTE' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('PENDENTE')}
          >
            Pendentes
          </Button>
          <Button
            variant={filter === 'APROVADO' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('APROVADO')}
          >
            Aprovadas
          </Button>
          <Button
            variant={filter === 'RECUSADO' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('RECUSADO')}
          >
            Recusadas
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            </div>
          ) : trades?.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma solicitação encontrada</p>
          ) : (
            <div className="space-y-4">
              {trades?.map?.((trade: any) => (
                <motion.div
                  key={trade?.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant={statusConfig[trade?.status ?? 'PENDENTE']?.variant ?? 'warning'}>
                          {statusConfig[trade?.status ?? 'PENDENTE']?.label ?? 'Pendente'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          <ClientTime date={trade?.createdAt} formatStr="dd/MM/yyyy 'às' HH:mm" />
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm mb-2">
                        <span className="font-medium text-gray-900">{trade?.requester?.name ?? 'Solicitante'}</span>
                        <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{trade?.targetUser?.name ?? 'Destino'}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {trade?.shift?.hospital?.name ?? 'Hospital'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <ClientTime date={trade?.shift?.startDate} formatStr="dd/MM/yyyy HH:mm" />
                        </span>
                      </div>

                      {trade?.justification && (
                        <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Justificativa:
                          </p>
                          <p className="text-sm text-gray-700">{trade.justification}</p>
                        </div>
                      )}
                    </div>

                    {trade?.status === 'PENDENTE' && (
                      <div className="flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => openModal(trade)}
                        >
                          <Check className="h-4 w-4" />
                          Aprovar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedTrade(trade);
                            handleAction('RECUSADO');
                          }}
                        >
                          <X className="h-4 w-4" />
                          Recusar
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )) ?? []}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Aprovar Solicitação de Troca"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Troca de plantão:</p>
            <p className="font-medium">
              {selectedTrade?.requester?.name ?? 'Solicitante'} → {selectedTrade?.targetUser?.name ?? 'Destino'}
            </p>
            <p className="text-sm text-gray-500">
              {selectedTrade?.shift?.hospital?.name ?? 'Hospital'} •{' '}
              <ClientTime date={selectedTrade?.shift?.startDate} formatStr="dd/MM/yyyy HH:mm" />
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações do Admin (opcional)
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Adicione uma observação..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={() => handleAction('APROVADO')}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Aprovação'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
