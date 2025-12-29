import { supabase } from './supabaseClient';
import { LeaveRequest, User, LeaveStatus, RolePermissions, AppFeature } from '../types';

// Helper types aligned with Supabase schema (snake_case)
type DbUser = {
  id: string;
  username: string | null;
  password: string | null;
  name: string;
  department: string;
  role: 'EMPLOYEE' | 'HR_ADMIN';
  annual_leave_used: number;
  public_holiday_used: number;
  avatar: string | null;
};

type DbLeaveRequest = {
  id: string;
  user_id: string;
  user_name: string;
  department: string;
  type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  status: string;
  reason: string | null;
  created_at: string;
};

type DbLeaveSettings = {
  id: string;
  annual_leave_limit: number;
  public_holiday_count: number;
};

export async function fetchUsersAndRequests() {
  if (!supabase) return null;

  const [usersRes, reqRes] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
  ]);

  if (usersRes.error || reqRes.error) {
    console.warn('[Supabase] Failed to load initial data', usersRes.error || reqRes.error);
    return null;
  }

  const users: User[] = (usersRes.data as DbUser[]).map((u) => ({
    id: u.id,
    username: u.username ?? undefined,
    password: u.password ?? undefined,
    name: u.name,
    department: u.department,
    role: u.role,
    annualLeaveUsed: u.annual_leave_used,
    publicHolidayUsed: u.public_holiday_used,
    avatar: u.avatar ?? '',
  }));

  const requests: LeaveRequest[] = (reqRes.data as DbLeaveRequest[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    department: r.department,
    type: r.type as LeaveRequest['type'],
    startDate: r.start_date,
    endDate: r.end_date,
    daysCount: r.days_count,
    status: r.status as LeaveRequest['status'],
    reason: r.reason ?? '',
    createdAt: r.created_at,
  }));

  return { users, requests };
}

// -------- Leave settings (global quotas) -----------------------

export async function fetchLeaveSettings(): Promise<{ annualLeaveLimit: number; publicHolidayCount: number } | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('leave_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[Supabase] Failed to fetch leave_settings', error);
    return null;
  }

  if (!data) return null;

  const row = data as DbLeaveSettings;
  return {
    annualLeaveLimit: row.annual_leave_limit,
    publicHolidayCount: row.public_holiday_count,
  };
}

export async function updateLeaveSettings(annualLeaveLimit: number, publicHolidayCount: number): Promise<void> {
  if (!supabase) return;

  // use first row as singleton
  const { data, error } = await supabase
    .from('leave_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[Supabase] Failed to read leave_settings for update', error);
    return;
  }

  const payload = {
    annual_leave_limit: annualLeaveLimit,
    public_holiday_count: publicHolidayCount,
  };

  if (data && (data as { id: string }).id) {
    const { error: upError } = await supabase
      .from('leave_settings')
      .update(payload)
      .eq('id', (data as { id: string }).id);

    if (upError) {
      console.warn('[Supabase] Failed to update leave_settings', upError);
    }
  } else {
    const { error: insError } = await supabase.from('leave_settings').insert(payload);
    if (insError) {
      console.warn('[Supabase] Failed to insert leave_settings', insError);
    }
  }
}

export async function insertLeaveRequest(req: LeaveRequest) {
  if (!supabase) return;

  // สำหรับ insert เราให้ Supabase สร้าง created_at เอง และใช้ id แบบ UUID จากฝั่ง client
  const payload = {
    id: req.id,
    user_id: req.userId,
    user_name: req.userName,
    department: req.department,
    type: req.type,
    start_date: req.startDate,
    end_date: req.endDate,
    days_count: req.daysCount,
    status: req.status,
    reason: req.reason || null,
  };

  const { error } = await supabase.from('leave_requests').insert(payload);
  if (error) {
    console.warn('[Supabase] Failed to insert leave_request', error);
  }
}

/**
 * สร้าง user ใหม่ใน Supabase
 * Supabase จะสร้าง UUID ให้อัตโนมัติ (ไม่ต้องส่ง id มา)
 */
export async function insertUser(user: Omit<User, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  const payload = {
    username: user.username || null,
    password: user.password || null,
    name: user.name,
    department: user.department,
    role: user.role,
    annual_leave_used: user.annualLeaveUsed || 0,
    public_holiday_used: user.publicHolidayUsed || 0,
    avatar: user.avatar || null,
  };

  const { data, error } = await supabase
    .from('users')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    console.warn('[Supabase] Failed to insert user', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

/**
 * อัปเดต user ใน Supabase
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  const payload: any = {};
  if (updates.username !== undefined) payload.username = updates.username || null;
  if (updates.password !== undefined) payload.password = updates.password || null;
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.department !== undefined) payload.department = updates.department;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.annualLeaveUsed !== undefined) payload.annual_leave_used = updates.annualLeaveUsed;
  if (updates.publicHolidayUsed !== undefined) payload.public_holiday_used = updates.publicHolidayUsed;
  if (updates.avatar !== undefined) payload.avatar = updates.avatar || null;

  const { error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId);

  if (error) {
    console.warn('[Supabase] Failed to update user', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * ลบ user จาก Supabase
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    console.warn('[Supabase] Failed to delete user', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// อัปเดตสถานะคำขอลาใน Supabase ให้ตรงกับที่อนุมัติ/ไม่อนุมัติในหน้า Approvals
export async function updateLeaveStatus(id: string, status: LeaveStatus): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('leave_requests')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.warn('[Supabase] Failed to update leave status', error);
  }
}

/**
 * ลบ leave request จาก Supabase
 */
export async function deleteLeaveRequest(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  const { error } = await supabase
    .from('leave_requests')
    .delete()
    .eq('id', id);

  if (error) {
    console.warn('[Supabase] Failed to delete leave request', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// -------- Departments CRUD -----------------------

export async function fetchDepartments(): Promise<string[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('departments')
    .select('name')
    .order('name');

  if (error) {
    console.warn('[Supabase] Failed to fetch departments', error);
    return [];
  }

  return (data || []).map((d: { name: string }) => d.name);
}

export async function insertDepartment(name: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  const { error } = await supabase
    .from('departments')
    .insert({ name });

  if (error) {
    console.warn('[Supabase] Failed to insert department', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateDepartmentName(oldName: string, newName: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  const { error } = await supabase
    .from('departments')
    .update({ name: newName })
    .eq('name', oldName);

  if (error) {
    console.warn('[Supabase] Failed to update department', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteDepartmentByName(name: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('name', name);

  if (error) {
    console.warn('[Supabase] Failed to delete department', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// -------- Permissions CRUD -----------------------

export async function fetchPermissions(): Promise<RolePermissions | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('role_permissions')
    .select('*');

  if (error) {
    console.warn('[Supabase] Failed to fetch permissions', error);
    return null;
  }

  if (!data || data.length === 0) return null;

  // Convert from database format to RolePermissions
  const permissions: RolePermissions = {
    EMPLOYEE: {
      VIEW_DASHBOARD: false,
      VIEW_CALENDAR: false,
      REQUEST_LEAVE: false,
      APPROVE_LEAVE: false,
      MANAGE_SETTINGS: false,
      VIEW_REPORTS: false,
    },
    HR_ADMIN: {
      VIEW_DASHBOARD: false,
      VIEW_CALENDAR: false,
      REQUEST_LEAVE: false,
      APPROVE_LEAVE: false,
      MANAGE_SETTINGS: false,
      VIEW_REPORTS: false,
    },
  };

  (data as Array<{ role: 'EMPLOYEE' | 'HR_ADMIN'; feature: string; allowed: boolean }>).forEach((row) => {
    if (permissions[row.role] && row.feature in permissions[row.role]) {
      permissions[row.role][row.feature as AppFeature] = row.allowed;
    }
  });

  return permissions;
}

export async function updatePermission(role: 'EMPLOYEE' | 'HR_ADMIN', feature: string, allowed: boolean): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  const { error } = await supabase
    .from('role_permissions')
    .upsert({ role, feature, allowed }, { onConflict: 'role,feature' });

  if (error) {
    console.warn('[Supabase] Failed to update permission', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// -------- Office Holidays CRUD -----------------------

export type OfficeHolidays = {
  sunday: boolean;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
};

type DbOfficeHolidays = {
  id: string;
  sunday: boolean;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
};

export async function fetchOfficeHolidays(): Promise<OfficeHolidays | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('office_holidays')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[Supabase] Failed to fetch office_holidays', error);
    return null;
  }

  if (!data) {
    // Return default (Sunday is holiday)
    return {
      sunday: true,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
    };
  }

  const row = data as DbOfficeHolidays;
  return {
    sunday: row.sunday,
    monday: row.monday,
    tuesday: row.tuesday,
    wednesday: row.wednesday,
    thursday: row.thursday,
    friday: row.friday,
    saturday: row.saturday,
  };
}

export async function updateOfficeHolidays(holidays: OfficeHolidays): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  // Check if a row exists
  const { data: existing, error: fetchError } = await supabase
    .from('office_holidays')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.warn('[Supabase] Failed to read office_holidays for update', fetchError);
    return { success: false, error: fetchError.message };
  }

  const payload = {
    ...holidays,
    updated_at: new Date().toISOString(),
  };

  if (existing && (existing as { id: string }).id) {
    // Update existing row
    const { error: upError } = await supabase
      .from('office_holidays')
      .update(payload)
      .eq('id', (existing as { id: string }).id);

    if (upError) {
      console.warn('[Supabase] Failed to update office_holidays', upError);
      return { success: false, error: upError.message };
    }
  } else {
    // Insert new row
    const { error: insError } = await supabase.from('office_holidays').insert(payload);
    if (insError) {
      console.warn('[Supabase] Failed to insert office_holidays', insError);
      return { success: false, error: insError.message };
    }
  }

  return { success: true };
}
