import { supabase } from './supabaseClient';
import { LeaveRequest, User } from '../types';

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

export async function insertLeaveRequest(req: LeaveRequest) {
  if (!supabase) return;

  const payload: DbLeaveRequest = {
    id: req.id,
    user_id: req.userId,
    user_name: req.userName,
    department: req.department,
    type: req.type,
    start_date: req.startDate,
    end_date: req.endDate,
    days_count: req.daysCount,
    status: req.status,
    reason: req.reason,
    created_at: req.createdAt,
  };

  const { error } = await supabase.from('leave_requests').upsert(payload, { onConflict: 'id' });
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


