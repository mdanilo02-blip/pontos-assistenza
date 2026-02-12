import { User, Hospital, Group, Shift, TradeRequest, Notification, GroupMember } from '@prisma/client';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}

export type UserWithRelations = User & {
  groupMemberships?: (GroupMember & { group: Group & { hospital: Hospital } })[];
};

export type ShiftWithRelations = Shift & {
  hospital: Hospital;
  user: User;
  group: Group;
  tradeRequests?: TradeRequestWithRelations[];
};

export type TradeRequestWithRelations = TradeRequest & {
  shift: ShiftWithRelations;
  requester: User;
  targetUser: User;
};

export type GroupWithRelations = Group & {
  hospital: Hospital;
  members?: (GroupMember & { user: User })[];
};

export type NotificationWithUser = Notification & {
  user: User;
};

export interface DashboardMetrics {
  totalShifts: number;
  totalProfessionals: number;
  pendingTrades: number;
  shiftsThisMonth: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  shift: ShiftWithRelations;
}
