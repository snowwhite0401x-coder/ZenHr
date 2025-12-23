
export enum Department {
  IT = 'IT',
  AI = 'AI',
  OPS = 'Ops'
}

export enum LeaveType {
  ANNUAL = 'Annual Leave', // Limited to 2 days/year
  SICK = 'Sick Leave', // Unlimited
  PERSONAL = 'Personal Leave', // Unlimited (Business)
  PUBLIC_HOLIDAY = 'Public Holiday' // 13 days
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface User {
  id: string;
  username?: string; // Added for login
  password?: string; // Added for login
  name: string;
  department: string; // Changed from enum to string for dynamic support
  role: 'EMPLOYEE' | 'HR_ADMIN';
  annualLeaveUsed: number; // Max 2
  publicHolidayUsed: number; // Max 13
  avatar: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  department: string; // Changed from enum to string for dynamic support
  type: LeaveType;
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate: string;   // ISO Date string YYYY-MM-DD
  daysCount: number;
  status: LeaveStatus;
  reason: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export type AppFeature = 'VIEW_DASHBOARD' | 'VIEW_CALENDAR' | 'REQUEST_LEAVE' | 'APPROVE_LEAVE' | 'MANAGE_SETTINGS' | 'VIEW_REPORTS';

export type RolePermissions = {
  [key in 'EMPLOYEE' | 'HR_ADMIN']: {
    [key in AppFeature]: boolean;
  }
};
