'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  User,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClientTime } from '@/components/ui/client-time';

const statusColors: Record<string, 'default' | 'success' | 'secondary' | 'destructive'> = {
  AGENDADO: 'default',
  CONCLUIDO: 'success',
  CANCELADO: 'destructive',
};

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    hospitalId: '',
    groupId: '',
    userId: '',
    notes: '',
    status: 'AGENDADO',
  });
  const [saving, setSaving] = useState(false);
  
  // Replication modal state
  const [replicateModalOpen, setReplicateModalOpen] = useState(false);
  const [replicateData, setReplicateData] = useState({
    userId: '',
    hospitalId: '',
    groupId: '',
    startTime: '07:00',
    endTime: '19:00',
    dayOfWeek: 1,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: '',
  });
  const [replicating, setReplicating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [shiftsRes, hospitalsRes, groupsRes, usersRes] = await Promise.all([
        fetch('/api/shifts'),
        fetch('/api/hospitals'),
        fetch('/api/groups'),
        fetch('/api/users?role=PROFISSIONAL'),
      ]);
      const [shiftsData, hospitalsData, groupsData, usersData] = await Promise.all([
        shiftsRes.json(),
        hospitalsRes.json(),
        groupsRes.json(),
        usersRes.json(),
      ]);
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);
      setHospitals(Array.isArray(hospitalsData) ? hospitalsData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setProfessionals(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (shift?: any) => {
    if (shift) {
      setEditingShift(shift);
      setFormData({
        startDate: shift?.startDate ? format(new Date(shift.startDate), "yyyy-MM-dd'T'HH:mm") : '',
        endDate: shift?.endDate ? format(new Date(shift.endDate), "yyyy-MM-dd'T'HH:mm") : '',
        hospitalId: shift?.hospitalId ?? '',
        groupId: shift?.groupId ?? '',
        userId: shift?.userId ?? '',
        notes: shift?.notes ?? '',
        status: shift?.status ?? 'AGENDADO',
      });
    } else {
      setEditingShift(null);
      setFormData({ startDate: '', endDate: '', hospitalId: '', groupId: '', userId: '', notes: '', status: 'AGENDADO' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts';
      const method = editingShift ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error?.error ?? 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Error saving shift:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este plantão?')) return;

    try {
      const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  const handleReplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplicating(true);

    try {
      const res = await fetch('/api/shifts/replicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(replicateData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`${data.count} plantões criados com sucesso!`);
        setReplicateModalOpen(false);
        fetchData();
        setReplicateData({
          userId: '',
          hospitalId: '',
          groupId: '',
          startTime: '07:00',
          endTime: '19:00',
          dayOfWeek: 1,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          notes: '',
        });
      } else {
        toast.error(data?.error ?? 'Erro ao replicar plantões');
      }
    } catch (error) {
      console.error('Error replicating shifts:', error);
      toast.error('Erro ao replicar plantões');
    } finally {
      setReplicating(false);
    }
  };

  const replicateFilteredGroups = groups?.filter?.((g: any) => g?.hospitalId === replicateData.hospitalId) ?? [];
  const replicateFilteredProfessionals = replicateData.groupId
    ? professionals?.filter?.((p: any) =>
        p?.groupMemberships?.some?.((gm: any) => gm?.groupId === replicateData.groupId)
      ) ?? []
    : professionals;

  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const filteredShifts = shifts?.filter?.((s: any) =>
    s?.user?.name?.toLowerCase()?.includes(search?.toLowerCase() ?? '') ||
    s?.hospital?.name?.toLowerCase()?.includes(search?.toLowerCase() ?? '')
  ) ?? [];

  const filteredGroups = groups?.filter?.((g: any) => g?.hospitalId === formData.hospitalId) ?? [];
  const filteredProfessionals = formData.groupId
    ? professionals?.filter?.((p: any) =>
        p?.groupMemberships?.some?.((gm: any) => gm?.groupId === formData.groupId)
      ) ?? []
    : professionals;

  // Calendar view helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getShiftsForDay = (day: Date) => {
    return shifts?.filter?.((s: any) => {
      const shiftDate = new Date(s?.startDate);
      return isSameDay(shiftDate, day);
    }) ?? [];
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
            <Calendar className="h-7 w-7 text-sky-500" />
            Plantões
          </h1>
          <p className="text-gray-500 text-sm">Gerencie os plantões agendados</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
            >
              Lista
            </Button>
            <Button
              variant={view === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('calendar')}
            >
              Calendário
            </Button>
          </div>
          <Button variant="outline" onClick={() => setReplicateModalOpen(true)}>
            <Copy className="h-4 w-4" />
            Replicar
          </Button>
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4" />
            Novo Plantão
          </Button>
        </div>
      </div>

      {view === 'list' ? (
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por profissional ou hospital..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
              </div>
            ) : filteredShifts?.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum plantão encontrado</p>
            ) : (
              <div className="space-y-3">
                {filteredShifts?.map?.((shift: any) => (
                  <motion.div
                    key={shift?.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{shift?.user?.name ?? 'Profissional'}</p>
                        <Badge variant={statusColors[shift?.status ?? 'AGENDADO'] ?? 'default'}>
                          {shift?.status ?? 'Status'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {shift?.hospital?.name ?? 'Hospital'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <ClientTime date={shift?.startDate} formatStr="dd/MM/yyyy HH:mm" />
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openModal(shift)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(shift?.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </motion.div>
                )) ?? []}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {daysInMonth.map((day) => {
                    const dayShifts = getShiftsForDay(day);
                    return (
                      <div
                        key={day.toISOString()}
                        className={`aspect-square p-1 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all ${
                          isSameDay(day, new Date()) ? 'border-sky-500 bg-sky-50' : 'border-gray-200'
                        }`}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            startDate: format(day, "yyyy-MM-dd'T'08:00"),
                            endDate: format(day, "yyyy-MM-dd'T'20:00"),
                          });
                          openModal();
                        }}
                      >
                        <span className="text-xs font-medium text-gray-700">{format(day, 'd')}</span>
                        <div className="mt-1 space-y-0.5 overflow-hidden">
                          {dayShifts?.slice?.(0, 2)?.map?.((shift: any) => (
                            <div
                              key={shift?.id}
                              className="text-[10px] bg-sky-100 text-sky-700 px-1 rounded truncate"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(shift);
                              }}
                            >
                              {shift?.user?.name?.split?.(' ')?.[0] ?? 'Nome'}
                            </div>
                          )) ?? []}
                          {(dayShifts?.length ?? 0) > 2 && (
                            <div className="text-[10px] text-gray-500">+{(dayShifts?.length ?? 0) - 2}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingShift ? 'Editar Plantão' : 'Novo Plantão'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início *</label>
              <Input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fim *</label>
              <Input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital *</label>
            <select
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              value={formData.hospitalId}
              onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value, groupId: '', userId: '' })}
              required
            >
              <option value="">Selecione</option>
              {hospitals?.map?.((h: any) => (
                <option key={h?.id} value={h?.id}>{h?.name}</option>
              )) ?? []}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupo/Escala *</label>
            <select
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value, userId: '' })}
              required
              disabled={!formData.hospitalId}
            >
              <option value="">Selecione</option>
              {filteredGroups?.map?.((g: any) => (
                <option key={g?.id} value={g?.id}>{g?.name}</option>
              )) ?? []}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profissional *</label>
            <select
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              required
            >
              <option value="">Selecione</option>
              {filteredProfessionals?.map?.((p: any) => (
                <option key={p?.id} value={p?.id}>{p?.name}</option>
              )) ?? []}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="AGENDADO">Agendado</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Replicate Modal */}
      <Modal
        isOpen={replicateModalOpen}
        onClose={() => setReplicateModalOpen(false)}
        title="Replicar Plantões para o Mês"
      >
        <form onSubmit={handleReplicate} className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Crie plantões automaticamente para um dia da semana específico durante todo o mês.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital *</label>
            <select
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              value={replicateData.hospitalId}
              onChange={(e) => setReplicateData({ ...replicateData, hospitalId: e.target.value, groupId: '', userId: '' })}
              required
            >
              <option value="">Selecione</option>
              {hospitals?.map?.((h: any) => (
                <option key={h?.id} value={h?.id}>{h?.name}</option>
              )) ?? []}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupo/Escala *</label>
            <select
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              value={replicateData.groupId}
              onChange={(e) => setReplicateData({ ...replicateData, groupId: e.target.value, userId: '' })}
              required
              disabled={!replicateData.hospitalId}
            >
              <option value="">Selecione</option>
              {replicateFilteredGroups?.map?.((g: any) => (
                <option key={g?.id} value={g?.id}>{g?.name}</option>
              )) ?? []}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profissional *</label>
            <select
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              value={replicateData.userId}
              onChange={(e) => setReplicateData({ ...replicateData, userId: e.target.value })}
              required
            >
              <option value="">Selecione</option>
              {replicateFilteredProfessionals?.map?.((p: any) => (
                <option key={p?.id} value={p?.id}>{p?.name}</option>
              )) ?? []}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Início *</label>
              <Input
                type="time"
                value={replicateData.startTime}
                onChange={(e) => setReplicateData({ ...replicateData, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fim *</label>
              <Input
                type="time"
                value={replicateData.endTime}
                onChange={(e) => setReplicateData({ ...replicateData, endTime: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana *</label>
            <select
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              value={replicateData.dayOfWeek}
              onChange={(e) => setReplicateData({ ...replicateData, dayOfWeek: parseInt(e.target.value) })}
              required
            >
              {dayNames.map((name, index) => (
                <option key={index} value={index}>{name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mês *</label>
              <select
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
                value={replicateData.month}
                onChange={(e) => setReplicateData({ ...replicateData, month: parseInt(e.target.value) })}
                required
              >
                {monthNames.map((name, index) => (
                  <option key={index + 1} value={index + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano *</label>
              <select
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
                value={replicateData.year}
                onChange={(e) => setReplicateData({ ...replicateData, year: parseInt(e.target.value) })}
                required
              >
                {[2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              rows={2}
              value={replicateData.notes}
              onChange={(e) => setReplicateData({ ...replicateData, notes: e.target.value })}
              placeholder="Ex: Plantão noturno, Sobreaviso, etc."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setReplicateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={replicating}>
              {replicating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Replicar Plantões'}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
