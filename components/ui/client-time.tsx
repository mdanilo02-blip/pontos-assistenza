'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientTimeProps {
  date: string | Date | null | undefined;
  formatStr?: string;
  fallback?: string;
}

export function ClientTime({ date, formatStr = 'HH:mm', fallback = '--' }: ClientTimeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !date) {
    return <span>{fallback}</span>;
  }

  try {
    return <span>{format(new Date(date), formatStr, { locale: ptBR })}</span>;
  } catch {
    return <span>{fallback}</span>;
  }
}

export function ClientDateTime({ date, formatStr = "dd/MM/yyyy 'às' HH:mm", fallback = '--' }: ClientTimeProps) {
  return <ClientTime date={date} formatStr={formatStr} fallback={fallback} />;
}
