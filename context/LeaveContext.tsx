import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LeaveRequest, User, LeaveStatus, LeaveType, RolePermissions, AppFeature, Department } from '../types.ts';
import { MOCK_REQUESTS, MOCK_USERS, ANNUAL_LEAVE_LIMIT, PUBLIC_HOLIDAY_COUNT } from '../constants.ts';
import { fetchUsersAndRequests, fetchLeaveSettings, updateLeaveSettings as supabaseUpdateLeaveSettings, updateUser as supabaseUpdateUser, insertLeaveRequest as supabaseInsertLeaveRequest } from '../services/supabaseLeaveService';
import { useLanguage } from './LanguageContext.tsx';

interface LeaveContextType {
  currentUser: User | null;
  users: User[];
  requests: LeaveRequest[];
  departments: string[];
  isAuthenticated: boolean;
  permissions: RolePermissions;
  googleSheetsUrl: string;
  annualLeaveLimit: number;
  publicHolidayCount: number;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updatedData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addRequest: (req: Omit<LeaveRequest, 'id' | 'createdAt' | 'userName' | 'status' | 'userId' | 'department'>) => Promise<{ success: boolean; message: string }>;
  updateRequestStatus: (id: string, status: LeaveStatus) => void;
  updatePermission: (role: 'EMPLOYEE' | 'HR_ADMIN', feature: AppFeature, value: boolean) => void;
  saveGoogleSheetsUrl: (url: string) => void;
  testGoogleSheetsConnection: () => Promise<boolean>;
  sendHeadersToSheet: () => Promise<boolean>;
  addDepartment: (name: string) => { success: boolean; message: string };
  updateDepartment: (oldName: string, newName: string) => { success: boolean; message: string };
  deleteDepartment: (name: string) => { success: boolean; message: string };
  updateLeaveLimits: (annual: number, publicCount: number) => void;
}

const DEFAULT_PERMISSIONS: RolePermissions = {
  EMPLOYEE: {
    VIEW_DASHBOARD: true,
    VIEW_CALENDAR: true,
    REQUEST_LEAVE: true,
    APPROVE_LEAVE: false,
    MANAGE_SETTINGS: false,
    VIEW_REPORTS: false,
  },
  HR_ADMIN: {
    VIEW_DASHBOARD: true,
    VIEW_CALENDAR: true,
    REQUEST_LEAVE: true,
    APPROVE_LEAVE: true,
    MANAGE_SETTINGS: true,
    VIEW_REPORTS: true,
  }
};

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const LeaveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);

  const [departments, setDepartments] = useState<string[]>(() => {
    const saved = localStorage.getItem('zenhr_departments');
    return saved ? JSON.parse(saved) : Object.values(Department);
  });

  const [permissions, setPermissions] = useState<RolePermissions>(() => {
    const saved = localStorage.getItem('zenhr_permissions');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.EMPLOYEE && parsed.EMPLOYEE.VIEW_REPORTS === undefined) {
          return DEFAULT_PERMISSIONS;
      }
      return parsed;
    }
    return DEFAULT_PERMISSIONS;
  });

  const [googleSheetsUrl, setGoogleSheetsUrl] = useState<string>(() => {
    return localStorage.getItem('zenhr_gsheet_url') || '';
  });

  const [annualLeaveLimit, setAnnualLeaveLimit] = useState<number>(() => {
    const saved = localStorage.getItem('zenhr_annual_limit');
    const n = saved ? Number(saved) : NaN;
    return Number.isFinite(n) && n > 0 ? n : ANNUAL_LEAVE_LIMIT;
  });

  const [publicHolidayCount, setPublicHolidayCount] = useState<number>(() => {
    const saved = localStorage.getItem('zenhr_public_holiday_count');
    const n = saved ? Number(saved) : NaN;
    return Number.isFinite(n) && n > 0 ? n : PUBLIC_HOLIDAY_COUNT;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem('zenhr_current_user_id');
  });

  const currentUser = currentUserId ? users.find(u => u.id === currentUserId) || null : null;
  const isAuthenticated = !!currentUser;

  // Initial load: try Supabase first, then fall back to localStorage/mocks
  useEffect(() => {
    (async () => {
      const fromSupabase = await fetchUsersAndRequests();
      if (fromSupabase && (fromSupabase.users.length > 0 || fromSupabase.requests.length > 0)) {
        setUsers(fromSupabase.users);
        setRequests(fromSupabase.requests);
      } else {
        const savedUsers = localStorage.getItem('zenhr_users');
        setUsers(savedUsers ? JSON.parse(savedUsers) : MOCK_USERS);

        const savedReqs = localStorage.getItem('zenhr_requests');
        setRequests(savedReqs ? JSON.parse(savedReqs) : MOCK_REQUESTS);
      }

      // fetch global leave quotas from Supabase if available
      const settings = await fetchLeaveSettings();
      if (settings) {
        setAnnualLeaveLimit(settings.annualLeaveLimit);
        setPublicHolidayCount(settings.publicHolidayCount);
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem('zenhr_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('zenhr_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('zenhr_permissions', JSON.stringify(permissions));
  }, [permissions]);
  
  useEffect(() => {
    localStorage.setItem('zenhr_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('zenhr_current_user_id', currentUserId);
    } else {
      localStorage.removeItem('zenhr_current_user_id');
    }
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('zenhr_gsheet_url', googleSheetsUrl);
  }, [googleSheetsUrl]);

  useEffect(() => {
    localStorage.setItem('zenhr_annual_limit', String(annualLeaveLimit));
  }, [annualLeaveLimit]);

  useEffect(() => {
    localStorage.setItem('zenhr_public_holiday_count', String(publicHolidayCount));
  }, [publicHolidayCount]);

  const login = (username: string, pass: string): boolean => {
    const user = users.find(u => u.username === username && u.password === pass);
    if (user) {
      setCurrentUserId(user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUserId(null);
  };

  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const updateUser = (id: string, updatedData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedData } : u));
    supabaseUpdateUser(id, updatedData).catch((err) =>
      console.warn('[Supabase] Failed to update user profile', err),
    );
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addDepartment = (name: string) => {
    if (departments.includes(name)) {
      return { success: false, message: t('msg.deptExists') };
    }
    setDepartments(prev => [...prev, name]);
    return { success: true, message: t('msg.deptAdded') };
  };

  const updateDepartment = (oldName: string, newName: string) => {
    if (oldName === newName) return { success: true, message: t('msg.noChange') };
    if (departments.includes(newName)) return { success: false, message: t('msg.deptNameExists') };
    
    setDepartments(prev => prev.map(d => d === oldName ? newName : d));
    setUsers(prev => prev.map(u => u.department === oldName ? { ...u, department: newName } : u));
    setRequests(prev => prev.map(r => r.department === oldName ? { ...r, department: newName } : r));

    return { success: true, message: t('msg.deptUpdated') };
  };

  const deleteDepartment = (name: string) => {
    const userCount = users.filter(u => u.department === name).length;
    if (userCount > 0) {
      return { success: false, message: t('msg.deptInUse', { count: userCount }) };
    }
    setDepartments(prev => prev.filter(d => d !== name));
    return { success: true, message: t('msg.deptDeleted') };
  };

  const updateLeaveLimits = (annual: number, publicCount: number) => {
    setAnnualLeaveLimit(annual);
    setPublicHolidayCount(publicCount);
    // persist to Supabase (shared for all users)
    supabaseUpdateLeaveSettings(annual, publicCount).catch((err) =>
      console.warn('[Supabase] Failed to update leave_settings', err),
    );
  };

  const updatePermission = (role: 'EMPLOYEE' | 'HR_ADMIN', feature: AppFeature, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [feature]: value
      }
    }));
  };

  const saveGoogleSheetsUrl = (url: string) => {
    setGoogleSheetsUrl(url);
  };

  const sendToGoogleSheets = async (data: any) => {
    if (!googleSheetsUrl) return false;

    const typeMapping: Record<string, string> = {
      [LeaveType.ANNUAL]: 'ลาพักร้อน',
      [LeaveType.SICK]: 'ลาป่วย',
      [LeaveType.PERSONAL]: 'ลากิจ',
      [LeaveType.PUBLIC_HOLIDAY]: 'วันหยุดนักขัตฤกษ์',
      'Test Connection': 'ทดสอบการเชื่อมต่อ'
    };

    let formattedDate = data.createdAt;
    if (typeof data.createdAt === 'string' && data.createdAt.includes('T')) {
         const timestamp = Date.parse(data.createdAt);
         if (!isNaN(timestamp)) {
             const dateObj = new Date(timestamp);
             const gmt7Time = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000));
             formattedDate = gmt7Time.toISOString().replace('T', ' ').substring(0, 19);
         }
    }

    const payload = {
      ...data,
      createdAt: formattedDate,
      type: typeMapping[data.type as string] || data.type
    };

    try {
      await fetch(googleSheetsUrl, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const testGoogleSheetsConnection = async () => {
    if (!googleSheetsUrl) return false;
    const dummyData = {
      createdAt: new Date().toISOString(),
      userName: 'Test User',
      department: 'IT',
      type: 'Test Connection',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      daysCount: 1,
      reason: 'Testing connection from settings',
      status: 'Test'
    };
    return await sendToGoogleSheets(dummyData);
  };

  const sendHeadersToSheet = async () => {
    if (!googleSheetsUrl) return false;
    const headers = {
      createdAt: 'Timestamp (GMT+7)',
      userName: 'Employee Name',
      department: 'Department',
      type: 'Leave Type',
      startDate: 'Start Date',
      endDate: 'End Date',
      daysCount: 'Total Days',
      reason: 'Reason',
      status: 'Status'
    };
    return await sendToGoogleSheets(headers);
  };

  const addRequest = async (data: Omit<LeaveRequest, 'id' | 'createdAt' | 'userName' | 'status' | 'userId' | 'department'>): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: t('err.notLoggedIn') };

    const requestYear = new Date(data.startDate).getFullYear();
    const currentYear = new Date().getFullYear();

    const calculateUsedInYear = (type: LeaveType) => {
        return requests
            .filter(r => 
                r.userId === currentUser.id &&
                r.status !== LeaveStatus.REJECTED &&
                r.type === type &&
                new Date(r.startDate).getFullYear() === requestYear
            )
            .reduce((sum, r) => sum + r.daysCount, 0);
    };

    if (data.type === LeaveType.ANNUAL) {
      const usedInRequestedYear = calculateUsedInYear(LeaveType.ANNUAL);
      if (usedInRequestedYear + data.daysCount > annualLeaveLimit) {
        return { success: false, message: t('err.annualLimit', { days: Math.max(0, annualLeaveLimit - usedInRequestedYear) }) };
      }
    }

    if (data.type === LeaveType.PUBLIC_HOLIDAY) {
      const usedInRequestedYear = calculateUsedInYear(LeaveType.PUBLIC_HOLIDAY);
      if (usedInRequestedYear + data.daysCount > publicHolidayCount) {
        return { success: false, message: t('err.publicLimit', { days: Math.max(0, publicHolidayCount - usedInRequestedYear) }) };
      }
    }

    const newRequest: LeaveRequest = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      department: currentUser.department,
      status: LeaveStatus.PENDING,
      createdAt: new Date().toISOString(),
      ...data
    };

    setRequests(prev => [newRequest, ...prev]);

    if (requestYear === currentYear) {
        if (data.type === LeaveType.ANNUAL) {
            setUsers(prev => prev.map(u => 
                u.id === currentUser.id 
                ? { ...u, annualLeaveUsed: u.annualLeaveUsed + data.daysCount }
                : u
            ));
        } else if (data.type === LeaveType.PUBLIC_HOLIDAY) {
            setUsers(prev => prev.map(u => 
                u.id === currentUser.id 
                ? { ...u, publicHolidayUsed: (u.publicHolidayUsed || 0) + data.daysCount }
                : u
            ));
        }
    }

    // บันทึกลง Supabase (ถ้ามีการตั้งค่า)
    supabaseInsertLeaveRequest(newRequest).catch((err) =>
      console.warn('[Supabase] Failed to insert leave_request from addRequest', err),
    );

    if (googleSheetsUrl) {
      sendToGoogleSheets(newRequest).catch(() => {});
    }

    return { success: true, message: t('msg.reqSuccess') };
  };

  const updateRequestStatus = (id: string, status: LeaveStatus) => {
    const targetRequest = requests.find(r => r.id === id);
    if (targetRequest && googleSheetsUrl) {
        sendToGoogleSheets({ ...targetRequest, status });
    }

    setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    
    if (status === LeaveStatus.REJECTED) {
        const req = requests.find(r => r.id === id);
        if (req) {
            const reqYear = new Date(req.startDate).getFullYear();
            const currentYear = new Date().getFullYear();
            if (reqYear === currentYear) {
                if (req.type === LeaveType.ANNUAL) {
                    setUsers(prev => prev.map(u => 
                        u.id === req.userId 
                        ? { ...u, annualLeaveUsed: Math.max(0, u.annualLeaveUsed - req.daysCount) }
                        : u
                    ));
                } else if (req.type === LeaveType.PUBLIC_HOLIDAY) {
                    setUsers(prev => prev.map(u => 
                        u.id === req.userId 
                        ? { ...u, publicHolidayUsed: Math.max(0, (u.publicHolidayUsed || 0) - req.daysCount) }
                        : u
                    ));
                }
            }
        }
    }
  };

  return (
    <LeaveContext.Provider value={{ currentUser, users, requests, departments, isAuthenticated, permissions, googleSheetsUrl, annualLeaveLimit, publicHolidayCount, login, logout, addUser, updateUser, deleteUser, addRequest, updateRequestStatus, updatePermission, saveGoogleSheetsUrl, testGoogleSheetsConnection, sendHeadersToSheet, addDepartment, updateDepartment, deleteDepartment, updateLeaveLimits }}>
      {children}
    </LeaveContext.Provider>
  );
};

export const useLeaveContext = () => {
  const context = useContext(LeaveContext);
  if (!context) throw new Error('useLeaveContext must be used within a LeaveProvider');
  return context;
};