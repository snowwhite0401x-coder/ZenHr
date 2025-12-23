import { Department, Holiday, LeaveRequest, LeaveStatus, LeaveType, User } from "./types.ts";

export const ANNUAL_LEAVE_LIMIT = 2;
export const PUBLIC_HOLIDAY_COUNT = 13;

// Mock Users
export const MOCK_USERS: User[] = [
  // Requested Admin User
  { 
    id: 'admin_01', 
    username: 'admin', 
    password: '123456', // Default password as requested
    name: 'Super Admin', 
    department: Department.OPS, 
    role: 'HR_ADMIN', 
    annualLeaveUsed: 0, 
    publicHolidayUsed: 0, 
    avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff' 
  },
  { id: 'u1', username: 'alice', password: '123', name: 'Alice Engineer', department: Department.IT, role: 'EMPLOYEE', annualLeaveUsed: 1, publicHolidayUsed: 2, avatar: 'https://picsum.photos/seed/alice/100/100' },
  { id: 'u2', username: 'bob', password: '123', name: 'Bob Data', department: Department.AI, role: 'EMPLOYEE', annualLeaveUsed: 0, publicHolidayUsed: 0, avatar: 'https://picsum.photos/seed/bob/100/100' },
  { id: 'u3', username: 'charlie', password: '123', name: 'Charlie Ops', department: Department.OPS, role: 'EMPLOYEE', annualLeaveUsed: 2, publicHolidayUsed: 5, avatar: 'https://picsum.photos/seed/charlie/100/100' },
  { id: 'u4', username: 'diana', password: '123', name: 'Diana Admin', department: Department.OPS, role: 'HR_ADMIN', annualLeaveUsed: 0, publicHolidayUsed: 0, avatar: 'https://picsum.photos/seed/diana/100/100' },
];

// Mock Holidays (Subset for demo)
export const MOCK_HOLIDAYS: Holiday[] = [
  { id: 'h1', date: '2024-01-01', name: 'New Year Day' },
  { id: 'h2', date: '2024-04-13', name: 'Songkran Festival' },
  { id: 'h3', date: '2024-04-14', name: 'Songkran Festival' },
  { id: 'h4', date: '2024-05-01', name: 'Labor Day' },
  { id: 'h5', date: '2024-12-05', name: 'Father Day' },
  { id: 'h6', date: '2024-12-31', name: 'New Year Eve' },
];

// Mock Initial Requests
export const MOCK_REQUESTS: LeaveRequest[] = [
  {
    id: 'lr1',
    userId: 'u1',
    userName: 'Alice Engineer',
    department: Department.IT,
    type: LeaveType.SICK,
    startDate: '2024-05-10',
    endDate: '2024-05-12',
    daysCount: 3,
    status: LeaveStatus.APPROVED,
    reason: 'Flu',
    createdAt: '2024-05-01'
  },
  {
    id: 'lr2',
    userId: 'u2',
    userName: 'Bob Data',
    department: Department.AI,
    type: LeaveType.ANNUAL,
    startDate: '2024-06-20',
    endDate: '2024-06-20',
    daysCount: 1,
    status: LeaveStatus.PENDING,
    reason: 'Family visit',
    createdAt: '2024-06-15'
  },
  {
    id: 'lr3',
    userId: 'u3',
    userName: 'Charlie Ops',
    department: Department.OPS,
    type: LeaveType.PERSONAL,
    startDate: '2024-05-25',
    endDate: '2024-05-25',
    daysCount: 1,
    status: LeaveStatus.APPROVED,
    reason: 'Bank appointment',
    createdAt: '2024-05-20'
  }
];