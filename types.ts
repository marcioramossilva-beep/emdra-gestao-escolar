
export enum UserRole {
  ADMIN = 'Admin',
  MANAGEMENT = 'Gestão',
  TEACHER = 'Professor'
}

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  classes?: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  isTeacher: boolean;
}

export enum OccurrenceType {
  PEDAGOGICAL = 'Pedagógica',
  BEHAVIORAL = 'Comportamental',
  SERIOUS = 'Grave'
}

export enum OccurrenceNature {
  RECORD = 'Registro de Ocorrência',
  WARNING = 'Advertência Disciplinar'
}

export interface Occurrence {
  id: string;
  student: string;
  className: string;
  date: string;
  shift: 'Manhã' | 'Tarde' | 'Integrada';
  reporter: string;
  nature: OccurrenceNature;
  type: OccurrenceType;
  reason: string;
  immediateAction: string;
  managementDecision: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  personName: string;
  roleOrSubject: string;
  type: 'Falta' | 'Atestado' | 'Atraso' | 'Banco de Horas' | 'TRE' | 'Doação de Sangue' | 'Declaração';
  date: string;
  minutes?: number;
  description: string;
  isTeacher: boolean;
}

export interface Demand {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  createdAt: number;
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  type: 'Feriado' | 'Reunião' | 'Evento Letivo';
}

export interface FinanceRecord {
  id: string;
  type: 'Inflow' | 'Outflow';
  category: 'Geral' | 'Obras';
  amount: number;
  description: string;
  date: string;
}

export interface Document {
  id: string;
  name: string;
  category: 'Lei' | 'Decreto' | 'Portaria';
  linkOrBase64: string;
  type: 'Link' | 'File';
}

export interface ParentMeeting {
  id: string;
  student: string;
  guardian: string;
  scheduledBy: string;
  attendedBy: string;
  date: string;
  time: string;
  reason: string;
  notes: string;
  createdAt: number;
