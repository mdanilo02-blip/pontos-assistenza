'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Download, FileText, Building2, Users, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ClientTime } from '@/components/ui/client-time';

interface Hospital {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
}

export default function ReportsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [userId, setUserId] = useState('');
  const [groupId, setGroupId] = useState('');

  // Report data
  const [reportType, setReportType] = useState('summary');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/app');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const [hospitalsRes, usersRes, groupsRes] = await Promise.all([
        fetch('/api/hospitals'),
        fetch('/api/users'),
        fetch('/api/groups'),
      ]);

      if (hospitalsRes.ok) setHospitals(await hospitalsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (groupsRes.ok) setGroups(await groupsRes.json());
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('type', reportType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (hospitalId) params.append('hospitalId', hospitalId);
      if (userId) params.append('userId', userId);
      if (groupId) params.append('groupId', groupId);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        toast.error('Erro ao gerar relatório');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = '';
    let filename = '';

    if (reportType === 'summary') {
      filename = 'relatorio_resumo.csv';
      csvContent = 'Tipo,Total Plantões,Concluídos,Procedimentos,Valor Total\n';
      csvContent += `Geral,${reportData.summary.totalShifts},${reportData.summary.completedShifts},${reportData.summary.totalProcedures},${reportData.summary.totalValue.toFixed(2)}\n`;
      csvContent += '\nPor Médico:\n';
      csvContent += 'Nome,Plantões,Concluídos,Procedimentos,Valor\n';
      reportData.byUser.forEach((u: any) => {
        csvContent += `${u.user.name},${u.totalShifts},${u.completedShifts},${u.totalProcedures},${u.totalValue.toFixed(2)}\n`;
      });
    } else if (reportType === 'shifts') {
      filename = 'relatorio_plantoes.csv';
      csvContent = 'Data,Médico,Hospital,Escala,Status,Check-in,Check-out\n';
      reportData.shifts.forEach((s: any) => {
        const checkIn = s.checkInOuts.find((c: any) => c.type === 'CHECKIN');
        const checkOut = s.checkInOuts.find((c: any) => c.type === 'CHECKOUT');
        csvContent += `${new Date(s.startDate).toLocaleDateString('pt-BR')},${s.user.name},${s.hospital.name},${s.group.name},${s.status},${checkIn ? 'Sim' : 'Não'},${checkOut ? 'Sim' : 'Não'}\n`;
      });
    } else if (reportType === 'procedures') {
      filename = 'relatorio_procedimentos.csv';
      csvContent = 'Data,Médico,Hospital,Procedimento,Código,Quantidade,Valor Unitário,Total\n';
      reportData.procedures.forEach((p: any) => {
        csvContent += `${new Date(p.shiftDate).toLocaleDateString('pt-BR')},${p.user.name},${p.hospital.name},${p.procedureName},${p.procedureCode},${p.quantity},${p.procedureValue.toFixed(2)},${p.totalValue.toFixed(2)}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    toast.success('Relatório exportado!');
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Gere relatórios de plantões e procedimentos</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Hospital</Label>
              <Select value={hospitalId} onValueChange={setHospitalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {hospitals.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Médico</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.filter((u: any) => u.role === 'PROFISSIONAL').map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Escala/Grupo</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Resumo Geral</SelectItem>
                  <SelectItem value="shifts">Plantões Detalhados</SelectItem>
                  <SelectItem value="procedures">Procedimentos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={generateReport} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Gerar Relatório
            </Button>
            {reportData && (
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Tabs defaultValue={reportType} className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary" onClick={() => setReportType('summary')}>Resumo</TabsTrigger>
            <TabsTrigger value="shifts" onClick={() => setReportType('shifts')}>Plantões</TabsTrigger>
            <TabsTrigger value="procedures" onClick={() => setReportType('procedures')}>Procedimentos</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          {reportType === 'summary' && reportData.summary && (
            <TabsContent value="summary" className="space-y-4">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{reportData.summary.totalShifts}</p>
                        <p className="text-sm text-muted-foreground">Total Plantões</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">{reportData.summary.completedShifts}</p>
                        <p className="text-sm text-muted-foreground">Concluídos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">{reportData.summary.totalProcedures}</p>
                        <p className="text-sm text-muted-foreground">Procedimentos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold">R$ {reportData.summary.totalValue.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* By User */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Por Médico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Médico</TableHead>
                        <TableHead>Plantões</TableHead>
                        <TableHead>Concluídos</TableHead>
                        <TableHead>Procedimentos</TableHead>
                        <TableHead>Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.byUser.map((item: any) => (
                        <TableRow key={item.user.id}>
                          <TableCell className="font-medium">{item.user.name}</TableCell>
                          <TableCell>{item.totalShifts}</TableCell>
                          <TableCell>{item.completedShifts}</TableCell>
                          <TableCell>{item.totalProcedures}</TableCell>
                          <TableCell>R$ {item.totalValue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* By Hospital */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Por Hospital
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hospital</TableHead>
                        <TableHead>Plantões</TableHead>
                        <TableHead>Concluídos</TableHead>
                        <TableHead>Procedimentos</TableHead>
                        <TableHead>Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.byHospital.map((item: any) => (
                        <TableRow key={item.hospital.id}>
                          <TableCell className="font-medium">{item.hospital.name}</TableCell>
                          <TableCell>{item.totalShifts}</TableCell>
                          <TableCell>{item.completedShifts}</TableCell>
                          <TableCell>{item.totalProcedures}</TableCell>
                          <TableCell>R$ {item.totalValue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Shifts Tab */}
          {reportType === 'shifts' && reportData.shifts && (
            <TabsContent value="shifts">
              <Card>
                <CardHeader>
                  <CardTitle>Plantões ({reportData.shifts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Médico</TableHead>
                        <TableHead>Hospital</TableHead>
                        <TableHead>Escala</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.shifts.map((shift: any) => {
                        const checkIn = shift.checkInOuts.find((c: any) => c.type === 'CHECKIN');
                        const checkOut = shift.checkInOuts.find((c: any) => c.type === 'CHECKOUT');
                        return (
                          <TableRow key={shift.id}>
                            <TableCell>
                              {new Date(shift.startDate).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>{shift.user.name}</TableCell>
                            <TableCell>{shift.hospital.name}</TableCell>
                            <TableCell>{shift.group.name}</TableCell>
                            <TableCell>
                              <Badge
                                variant={shift.status === 'CONCLUIDO' ? 'default' : 'secondary'}
                              >
                                {shift.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {checkIn ? (
                                <Badge variant="outline" className="bg-green-50">
                                  <ClientTime date={checkIn.timestamp} />
                                </Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {checkOut ? (
                                <Badge variant="outline" className="bg-green-50">
                                  <ClientTime date={checkOut.timestamp} />
                                </Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Procedures Tab */}
          {reportType === 'procedures' && reportData.procedures && (
            <TabsContent value="procedures">
              <Card>
                <CardHeader>
                  <CardTitle>Procedimentos ({reportData.procedures.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Médico</TableHead>
                        <TableHead>Hospital</TableHead>
                        <TableHead>Procedimento</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Valor Unit.</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.procedures.map((proc: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {new Date(proc.shiftDate).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>{proc.user.name}</TableCell>
                          <TableCell>{proc.hospital.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {proc.procedureName}
                          </TableCell>
                          <TableCell>{proc.procedureCode}</TableCell>
                          <TableCell>{proc.quantity}</TableCell>
                          <TableCell>R$ {proc.procedureValue.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">
                            R$ {proc.totalValue.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
