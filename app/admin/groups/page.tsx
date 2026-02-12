'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  Users,
  Loader2,
} from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hospitalId: '',
    memberIds: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, hospitalsRes, usersRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/hospitals'),
        fetch('/api/users?role=PROFISSIONAL'),
      ]);
      const [groupsData, hospitalsData, usersData] = await Promise.all([
        groupsRes.json(),
        hospitalsRes.json(),
        usersRes.json(),
      ]);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setHospitals(Array.isArray(hospitalsData) ? hospitalsData : []);
      setProfessionals(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (group?: any) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group?.name ?? '',
        description: group?.description ?? '',
        hospitalId: group?.hospitalId ?? '',
        memberIds: group?.members?.map?.((m: any) => m?.userId) ?? [],
      });
    } else {
      setEditingGroup(null);
      setFormData({ name: '', description: '', hospitalId: '', memberIds: [] });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingGroup ? `/api/groups/${editingGroup.id}` : '/api/groups';
      const method = editingGroup ? 'PUT' : 'POST';

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
      console.error('Error saving group:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo?')) return;

    try {
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const filteredGroups = groups?.filter?.((g: any) =>
    g?.name?.toLowerCase()?.includes(search?.toLowerCase() ?? '') ||
    g?.hospital?.name?.toLowerCase()?.includes(search?.toLowerCase() ?? '')
  ) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="h-7 w-7 text-sky-500" />
            Grupos / Escalas
          </h1>
          <p className="text-gray-500 text-sm">Gerencie os grupos e escalas de plantões</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4" />
          Novo Grupo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou hospital..."
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
          ) : filteredGroups?.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum grupo encontrado</p>
          ) : (
            <div className="space-y-3">
              {filteredGroups?.map?.((group: any) => (
                <motion.div
                  key={group?.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Layers className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{group?.name ?? 'Grupo'}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {group?.hospital?.name ?? 'Hospital'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {group?._count?.members ?? group?.members?.length ?? 0} membros
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openModal(group)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(group?.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
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
        title={editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital *</label>
            <select
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              value={formData.hospitalId}
              onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
              required
            >
              <option value="">Selecione um hospital</option>
              {hospitals?.map?.((hospital: any) => (
                <option key={hospital?.id} value={hospital?.id}>
                  {hospital?.name}
                </option>
              )) ?? []}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Membros</label>
            <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
              {professionals?.map?.((prof: any) => (
                <label key={prof?.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.memberIds?.includes?.(prof?.id) ?? false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, memberIds: [...(formData.memberIds ?? []), prof?.id] });
                      } else {
                        setFormData({ ...formData, memberIds: formData.memberIds?.filter?.((id) => id !== prof?.id) ?? [] });
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{prof?.name}</span>
                </label>
              )) ?? []}
            </div>
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
    </motion.div>
  );
}
