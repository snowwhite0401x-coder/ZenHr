import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LeaveRequest, User, LeaveStatus, LeaveType, RolePermissions, AppFeature, Department } from '../types.ts';
import { MOCK_REQUESTS, MOCK_USERS, ANNUAL_LEAVE_LIMIT, PUBLIC_HOLIDAY_COUNT } from '../constants.ts';
import { useLanguage } from './LanguageContext.tsx';
import { fetchUsersAndRequests, fetchLeaveSettings, updateLeaveSettings as supabaseUpdateLeaveSettings, updateUser as supabaseUpdateUser, insertUser as supabaseInsertUser, deleteUser as supabaseDeleteUser, insertLeaveRequest as supabaseInsertLeaveRequest, updateLeaveStatus as supabaseUpdateLeaveStatus, deleteLeaveRequest as supabaseDeleteLeaveRequest, fetchDepartments as supabaseFetchDepartments, insertDepartment as supabaseInsertDepartment, updateDepartmentName as supabaseUpdateDepartmentName, deleteDepartmentByName as supabaseDeleteDepartmentByName, fetchPermissions as supabaseFetchPermissions, updatePermission as supabaseUpdatePermission } from '../services/supabaseLeaveService';

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
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, updatedData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addRequest: (req: Omit<LeaveRequest, 'id' | 'createdAt' | 'userName' | 'status' | 'userId' | 'department'>) => Promise<{ success: boolean; message: string }>;
  updateRequestStatus: (id: string, status: LeaveStatus) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  updatePermission: (role: 'EMPLOYEE' | 'HR_ADMIN', feature: AppFeature, value: boolean) => Promise<void>;
  saveGoogleSheetsUrl: (url: string) => void;
  testGoogleSheetsConnection: () => Promise<boolean>;
  sendHeadersToSheet: () => Promise<boolean>;
  addDepartment: (name: string) => Promise<{ success: boolean; message: string }>;
  updateDepartment: (oldName: string, newName: string) => Promise<{ success: boolean; message: string }>;
  deleteDepartment: (name: string) => Promise<{ success: boolean; message: string }>;
  updateLeaveLimits: (annual: number, publicCount: number) => Promise<void>;
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
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('zenhr_users');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [requests, setRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('zenhr_requests');
    return saved ? JSON.parse(saved) : MOCK_REQUESTS;
  });

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

      // fetch departments from Supabase if available
      const deptsFromSupabase = await supabaseFetchDepartments();
      if (deptsFromSupabase.length > 0) {
        setDepartments(deptsFromSupabase);
      } else {
        const saved = localStorage.getItem('zenhr_departments');
        if (saved) {
          setDepartments(JSON.parse(saved));
        }
      }

      // fetch permissions from Supabase if available
      const permsFromSupabase = await supabaseFetchPermissions();
      if (permsFromSupabase) {
        setPermissions(permsFromSupabase);
      } else {
        const saved = localStorage.getItem('zenhr_permissions');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.EMPLOYEE && parsed.EMPLOYEE.VIEW_REPORTS === undefined) {
            setPermissions(DEFAULT_PERMISSIONS);
          } else {
            setPermissions(parsed);
          }
        }
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

  const addUser = async (user: User) => {
    // บันทึกลง Supabase ก่อน (ส่งข้อมูลโดยไม่รวม id เพราะ Supabase จะสร้างให้)
    const { id, ...userWithoutId } = user;
    const result = await supabaseInsertUser(userWithoutId);
    
    if (result.success && result.id) {
      // ใช้ id ที่ Supabase สร้างให้
      setUsers(prev => {
        const existing = prev.find(u => u.id === id);
        if (existing) {
          return prev.map(u => u.id === id ? { ...u, id: result.id! } : u);
        }
        return [...prev, { ...user, id: result.id! }];
      });
    } else {
      // ถ้า Supabase ไม่ได้ตั้งค่า หรือ error ให้ใช้ id เดิม
      setUsers(prev => [...prev, user]);
      if (result.error) {
        console.warn('[Supabase] Failed to insert user, using local state only', result.error);
      }
    }
  };

  const updateUser = async (id: string, updatedData: Partial<User>) => {
    // บันทึกลง Supabase ก่อน
    const result = await supabaseUpdateUser(id, updatedData);
    if (!result.success) {
      console.warn('[Supabase] Failed to update user', result.error);
      // ยังอัปเดต state ต่อ (fallback)
    }
    // อัปเดต state หลังจาก Supabase
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedData } : u));
  };

  const deleteUser = async (id: string) => {
    // ลบจาก Supabase ก่อน
    const result = await supabaseDeleteUser(id);
    if (!result.success) {
      console.warn('[Supabase] Failed to delete user', result.error);
      // ยังลบจาก state ต่อ (fallback)
    }
    // ลบจาก state หลังจาก Supabase
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addDepartment = async (name: string) => {
    if (departments.includes(name)) {
      return { success: false, message: t('msg.deptExists') };
    }
    
    // บันทึกลง Supabase ก่อน
    const result = await supabaseInsertDepartment(name);
    if (!result.success) {
      console.warn('[Supabase] Failed to insert department', result.error);
      return { success: false, message: result.error || t('msg.deptAddFailed') };
    }

    // ถ้าบันทึก Supabase สำเร็จแล้วค่อยอัปเดต state
    setDepartments(prev => [...prev, name]);
    return { success: true, message: t('msg.deptAdded') };
  };

  const updateDepartment = async (oldName: string, newName: string) => {
    if (oldName === newName) return { success: true, message: t('msg.noChange') };
    if (departments.includes(newName)) return { success: false, message: t('msg.deptNameExists') };
    
    // อัปเดตใน Supabase ก่อน
    const result = await supabaseUpdateDepartmentName(oldName, newName);
    if (!result.success) {
      console.warn('[Supabase] Failed to update department', result.error);
      return { success: false, message: result.error || t('msg.deptUpdateFailed') };
    }

    // ถ้าอัปเดต Supabase สำเร็จแล้วค่อยอัปเดต state
    setDepartments(prev => prev.map(d => d === oldName ? newName : d));
    setUsers(prev => prev.map(u => u.department === oldName ? { ...u, department: newName } : u));
    setRequests(prev => prev.map(r => r.department === oldName ? { ...r, department: newName } : r));

    return { success: true, message: t('msg.deptUpdated') };
  };

  const deleteDepartment = async (name: string) => {
    const userCount = users.filter(u => u.department === name).length;
    if (userCount > 0) {
      return { success: false, message: t('msg.deptInUse', { count: userCount }) };
    }

    // ลบจาก Supabase ก่อน
    const result = await supabaseDeleteDepartmentByName(name);
    if (!result.success) {
      console.warn('[Supabase] Failed to delete department', result.error);
      return { success: false, message: result.error || t('msg.deptDeleteFailed') };
    }

    // ถ้าลบจาก Supabase สำเร็จแล้วค่อยอัปเดต state
    setDepartments(prev => prev.filter(d => d !== name));
    return { success: true, message: t('msg.deptDeleted') };
  };

  const updatePermission = async (role: 'EMPLOYEE' | 'HR_ADMIN', feature: AppFeature, value: boolean) => {
    // บันทึกลง Supabase ก่อน
    const result = await supabaseUpdatePermission(role, feature, value);
    if (!result.success) {
      console.warn('[Supabase] Failed to update permission', result.error);
      // ยังอัปเดต state ต่อ (fallback)
    }
    // อัปเดต state หลังจาก Supabase
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [feature]: value
      }
    }));
  };

  const updateLeaveLimits = async (annual: number, publicCount: number) => {
    // บันทึกลง Supabase ก่อน
    await supabaseUpdateLeaveSettings(annual, publicCount).catch((err) => {
      console.warn('[Supabase] Failed to update leave_settings', err);
    });
    // อัปเดต state หลังจาก Supabase
    setAnnualLeaveLimit(annual);
    setPublicHolidayCount(publicCount);
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

    // NOTE type ไม่ต้องตรวจสอบ limit และไม่นับเป็นวันลา
    if (data.type === LeaveType.NOTE) {
      // สำหรับ NOTE ให้ daysCount เป็น 0 เสมอ
      data.daysCount = 0;
    }

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
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      department: currentUser.department,
      status: LeaveStatus.PENDING,
      createdAt: new Date().toISOString(),
      ...data
    };

    // บันทึกลง Supabase ก่อน
    await supabaseInsertLeaveRequest(newRequest).catch((err) => {
      console.warn('[Supabase] Failed to insert leave_request from addRequest', err);
    });

    // อัปเดต state หลังจาก Supabase
    setRequests(prev => [newRequest, ...prev]);

    // ไม่ต้องอัปเดตวันลาที่ใช้ไปตอนขอลา เพราะยังไม่ได้อนุมัติ
    // จะอัปเดตเมื่ออนุมัติใน updateRequestStatus เท่านั้น

    if (googleSheetsUrl) {
      sendToGoogleSheets(newRequest).catch(() => {});
    }

    return { success: true, message: t('msg.reqSuccess') };
  };

  const deleteRequest = async (id: string) => {
    const targetRequest = requests.find(r => r.id === id);
    if (!targetRequest) return;

    // ถ้า request นี้ได้รับการอนุมัติแล้ว ต้องคืนวันลา
    if (targetRequest.status === LeaveStatus.APPROVED) {
      const user = users.find(u => u.id === targetRequest.userId);
      if (user) {
        const reqYear = new Date(targetRequest.startDate).getFullYear();
        const currentYear = new Date().getFullYear();
        
        // คืนวันลาเฉพาะปีปัจจุบัน
        if (reqYear === currentYear) {
          if (targetRequest.type === LeaveType.ANNUAL) {
            const newAnnualUsed = Math.max(0, user.annualLeaveUsed - targetRequest.daysCount);
            await supabaseUpdateUser(targetRequest.userId, { annualLeaveUsed: newAnnualUsed }).catch((err) => {
              console.warn('[Supabase] Failed to update annual_leave_used when deleting request', err);
            });
            setUsers(prev => prev.map(u => 
              u.id === targetRequest.userId 
              ? { ...u, annualLeaveUsed: newAnnualUsed }
              : u
            ));
          } else if (targetRequest.type === LeaveType.PUBLIC_HOLIDAY) {
            const newPublicUsed = Math.max(0, (user.publicHolidayUsed || 0) - targetRequest.daysCount);
            await supabaseUpdateUser(targetRequest.userId, { publicHolidayUsed: newPublicUsed }).catch((err) => {
              console.warn('[Supabase] Failed to update public_holiday_used when deleting request', err);
            });
            setUsers(prev => prev.map(u => 
              u.id === targetRequest.userId 
              ? { ...u, publicHolidayUsed: newPublicUsed }
              : u
            ));
          }
        }
      }
    }

    // ลบจาก Supabase ก่อน
    await supabaseDeleteLeaveRequest(id).catch((err) => {
      console.warn('[Supabase] Failed to delete leave request', err);
    });

    // ลบจาก state
    setRequests(prev => prev.filter(req => req.id !== id));
  };

  const updateRequestStatus = async (id: string, status: LeaveStatus) => {
    const targetRequest = requests.find(r => r.id === id);
    if (!targetRequest) return;

    if (targetRequest && googleSheetsUrl) {
        sendToGoogleSheets({ ...targetRequest, status });
    }

    // บันทึกลง Supabase ก่อน
    await supabaseUpdateLeaveStatus(id, status).catch((err) => {
      console.warn('[Supabase] Failed to update leave status', err);
    });
    
    // อัปเดต state หลังจาก Supabase
    setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    
    const reqYear = new Date(targetRequest.startDate).getFullYear();
    const currentYear = new Date().getFullYear();
    
    // อัปเดตวันลาที่ใช้ไปใน Supabase เมื่ออนุมัติหรือปฏิเสธ
    if (reqYear === currentYear && (status === LeaveStatus.APPROVED || status === LeaveStatus.REJECTED)) {
      const user = users.find(u => u.id === targetRequest.userId);
      if (!user) return;

      let newAnnualUsed = user.annualLeaveUsed;
      let newPublicUsed = user.publicHolidayUsed || 0;

      if (targetRequest.type === LeaveType.ANNUAL) {
        if (status === LeaveStatus.APPROVED) {
          // เพิ่มวันลาที่ใช้ไปเมื่ออนุมัติ
          newAnnualUsed = user.annualLeaveUsed + targetRequest.daysCount;
        } else if (status === LeaveStatus.REJECTED) {
          // ลดวันลาที่ใช้ไปเมื่อปฏิเสธ (ถ้าเคยอนุมัติมาก่อน)
          const oldStatus = targetRequest.status;
          if (oldStatus === LeaveStatus.APPROVED) {
            newAnnualUsed = Math.max(0, user.annualLeaveUsed - targetRequest.daysCount);
          }
        }
        // อัปเดตใน Supabase
        const updateResult = await supabaseUpdateUser(targetRequest.userId, { annualLeaveUsed: newAnnualUsed }).catch((err) => {
          console.warn('[Supabase] Failed to update annual_leave_used', err);
          return { success: false };
        });
        // อัปเดต state เฉพาะเมื่ออัปเดต Supabase สำเร็จ
        if (updateResult?.success !== false) {
          setUsers(prev => prev.map(u => 
            u.id === targetRequest.userId 
            ? { ...u, annualLeaveUsed: newAnnualUsed }
            : u
          ));
        }
      } else if (targetRequest.type === LeaveType.PUBLIC_HOLIDAY) {
        if (status === LeaveStatus.APPROVED) {
          // เพิ่มวันลาที่ใช้ไปเมื่ออนุมัติ
          newPublicUsed = (user.publicHolidayUsed || 0) + targetRequest.daysCount;
        } else if (status === LeaveStatus.REJECTED) {
          // ลดวันลาที่ใช้ไปเมื่อปฏิเสธ (ถ้าเคยอนุมัติมาก่อน)
          const oldStatus = targetRequest.status;
          if (oldStatus === LeaveStatus.APPROVED) {
            newPublicUsed = Math.max(0, (user.publicHolidayUsed || 0) - targetRequest.daysCount);
          }
        }
        // อัปเดตใน Supabase
        const updateResult = await supabaseUpdateUser(targetRequest.userId, { publicHolidayUsed: newPublicUsed }).catch((err) => {
          console.warn('[Supabase] Failed to update public_holiday_used', err);
          return { success: false };
        });
        // อัปเดต state เฉพาะเมื่ออัปเดต Supabase สำเร็จ
        if (updateResult?.success !== false) {
          setUsers(prev => prev.map(u => 
            u.id === targetRequest.userId 
            ? { ...u, publicHolidayUsed: newPublicUsed }
            : u
          ));
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