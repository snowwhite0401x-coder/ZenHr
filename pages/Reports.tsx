import React, { useState, useMemo } from 'react';
import { useLeaveContext } from '../context/LeaveContext';
import { useLanguage } from '../context/LanguageContext';
import { LeaveType, LeaveStatus, LeaveRequest } from '../types';

export const Reports: React.FC = () => {
  const { requests, departments, currentUser, permissions, users, annualLeaveLimit, publicHolidayCount } = useLeaveContext();
  const { t } = useLanguage();

  // Tabs
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'INDIVIDUAL'>('GENERAL');

  // General Report Filters
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Individual Report Filters
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [individualFilterYear, setIndividualFilterYear] = useState<string>(new Date().getFullYear().toString());

  // Check permissions
  if (!currentUser || !permissions[currentUser.role].VIEW_REPORTS) {
    return <div className="p-10 text-center text-red-500">{t('app.accessDenied')}</div>;
  }

  // --- GENERAL REPORT LOGIC ---
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      if (!req.startDate) return false;
      const parts = req.startDate.split('-');
      const reqYear = parts[0];
      const reqMonth = parseInt(parts[1], 10).toString();

      const matchYear = filterYear === 'ALL' || reqYear === filterYear;
      const matchMonth = filterMonth === 'ALL' || reqMonth === filterMonth;
      const matchDept = filterDept === 'ALL' || req.department === filterDept;
      const matchType = filterType === 'ALL' || req.type === filterType;

      return matchYear && matchMonth && matchDept && matchType;
    });
  }, [requests, filterYear, filterMonth, filterDept, filterType]);

  const downloadCSV = () => {
    const headers = [
      'วันที่ขอ',
      'พนักงาน',
      'แผนก',
      'ประเภทการลา',
      'ช่วงเวลา',
      'จำนวนวัน',
      'เหตุผล',
      'สถานะ'
    ];

    const rows = filteredRequests.map(req => {
      const safeReason = req.reason ? `"${req.reason.replace(/"/g, '""')}"` : '""';
      return [
        req.createdAt.split('T')[0],
        `"${req.userName}"`,
        req.department,
        `"${t('type.' + req.type)}"`,
        `${req.startDate} - ${req.endDate}`,
        req.daysCount,
        safeReason,
        t(`status.${req.status}`)
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leave_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setFilterMonth('ALL');
    setFilterYear(new Date().getFullYear().toString());
    setFilterDept('ALL');
    setFilterType('ALL');
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
  };

  // --- INDIVIDUAL REPORT LOGIC ---
  const selectedUser = users.find(u => u.id === selectedUserId);

  const individualStats = useMemo(() => {
    if (!selectedUser) return null;

    const userRequests = requests.filter(r => r.userId === selectedUser.id && r.status === LeaveStatus.APPROVED);
    const now = new Date();
    const currentMonth = now.getMonth();
    const selectedYearNum = parseInt(individualFilterYear);

    const parseLocalYMD = (dateStr: string) => {
      if (!dateStr) return new Date();
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number);
        return new Date(y, m - 1, d);
      }
      return new Date(dateStr);
    };

    const isSelectedYear = (d: Date) => d.getFullYear() === selectedYearNum;
    const isSelectedYearCurrentMonth = (d: Date) => d.getFullYear() === selectedYearNum && d.getMonth() === currentMonth;

    const stats = {
      totalThisMonth: 0,
      totalThisYear: 0,
      annual: {
        used: 0,
        limit: annualLeaveLimit,
        remaining: annualLeaveLimit
      },
      publicHoliday: {
        used: 0,
        limit: publicHolidayCount,
        remaining: publicHolidayCount
      },
      sick: { month: 0, year: 0 },
      personal: { month: 0, year: 0 }
    };

    userRequests.forEach(r => {
      const d = parseLocalYMD(r.startDate);
      const days = Number(r.daysCount) || 0;
      const inYear = isSelectedYear(d);
      const inMonth = isSelectedYearCurrentMonth(d);

      if (inYear) {
        stats.totalThisYear += days;
        if (inMonth) stats.totalThisMonth += days;

        if (r.type === LeaveType.ANNUAL) {
          stats.annual.used += days;
        } else if (r.type === LeaveType.PUBLIC_HOLIDAY) {
          stats.publicHoliday.used += days;
        } else if (r.type === LeaveType.SICK) {
          stats.sick.year += days;
          if (inMonth) stats.sick.month += days;
        } else if (r.type === LeaveType.PERSONAL) {
          stats.personal.year += days;
          if (inMonth) stats.personal.month += days;
        }
      }
    });

    stats.annual.remaining = Math.max(0, stats.annual.limit - stats.annual.used);
    stats.publicHoliday.remaining = Math.max(0, stats.publicHoliday.limit - stats.publicHoliday.used);

    return stats;
  }, [selectedUser, requests, selectedUserId, individualFilterYear, annualLeaveLimit, publicHolidayCount]);

  const individualHistory = useMemo(() => {
    if (!selectedUserId) return [];
    const selectedYearNum = parseInt(individualFilterYear);

    return requests
      .filter(r => {
        if (r.userId !== selectedUserId) return false;
        const reqYear = r.startDate ? parseInt(r.startDate.split('-')[0]) : 0;
        return reqYear === selectedYearNum;
      })
      .sort((a, b) => {
        const dateA = a.startDate || '';
        const dateB = b.startDate || '';
        return dateB.localeCompare(dateA);
      });
  }, [selectedUserId, requests, individualFilterYear]);

  const getLeaveTypeColor = (type: LeaveType) => {
    switch (type) {
      case LeaveType.ANNUAL:
        return { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' };
      case LeaveType.SICK:
        return { bg: 'bg-teal-50', text: 'text-teal-600', dot: 'bg-teal-500' };
      case LeaveType.PERSONAL:
        return { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' };
      case LeaveType.PUBLIC_HOLIDAY:
        return { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-500' };
    }
  };

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED:
        return { bg: 'bg-green-100', text: 'text-green-700' };
      case LeaveStatus.PENDING:
        return { bg: 'bg-amber-100', text: 'text-amber-700' };
      case LeaveStatus.REJECTED:
        return { bg: 'bg-red-100', text: 'text-red-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getUserFromRequest = (req: LeaveRequest) => {
    return users.find(u => u.id === req.userId);
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen p-6 md:p-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
              รายงานสรุปวันลา
            </h1>
            <p className="text-slate-500 font-light">ภาพรวมการใช้วันลาของพนักงานทั้งหมด</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('GENERAL')}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all text-sm flex items-center gap-2 ${activeTab === 'GENERAL'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              ภาพรวม
            </button>
            <button
              onClick={() => setActiveTab('INDIVIDUAL')}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all text-sm flex items-center gap-2 ${activeTab === 'INDIVIDUAL'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              รายบุคคล
            </button>
          </div>
        </div>

        {/* --- GENERAL REPORT VIEW --- */}
        {activeTab === 'GENERAL' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="w-full bg-slate-50 rounded-3xl p-6 relative overflow-hidden border border-slate-200">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-4 justify-between">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="relative group w-full sm:w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">apartment</span>
                    <select
                      className="w-full pl-10 pr-8 py-2.5 bg-white border-none rounded-xl text-sm font-medium text-slate-600 shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      value={filterDept}
                      onChange={(e) => setFilterDept(e.target.value)}
                    >
                      <option value="ALL">ทุกแผนก</option>
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative group w-full sm:w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">category</span>
                    <select
                      className="w-full pl-10 pr-8 py-2.5 bg-white border-none rounded-xl text-sm font-medium text-slate-600 shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="ALL">ทุกประเภท</option>
                      {Object.values(LeaveType).map(v => (
                        <option key={v} value={v}>{t(`type.${v}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center bg-white rounded-xl px-3 py-2.5 shadow-sm gap-2 w-full sm:w-auto">
                    <span className="text-slate-400 material-symbols-outlined text-[20px]">calendar_month</span>
                    <select
                      className="bg-transparent border-none text-sm text-slate-600 font-medium cursor-pointer focus:ring-0"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                    >
                      {[2023, 2024, 2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                  <button
                    onClick={resetFilters}
                    className="p-2.5 bg-white text-slate-500 hover:text-blue-600 rounded-xl shadow-sm transition-colors"
                    title="รีเซ็ตตัวกรอง"
                  >
                    <span className="material-symbols-outlined">restart_alt</span>
                  </button>
                  <button
                    onClick={downloadCSV}
                    disabled={filteredRequests.length === 0}
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span className="text-sm font-medium">Export CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-soft overflow-hidden border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b-2 border-slate-100">
                      <th className="p-5 pl-8 text-xs font-semibold uppercase tracking-wider text-slate-400">พนักงาน</th>
                      <th className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-400">แผนก</th>
                      <th className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-400">ประเภทการลา</th>
                      <th className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-400">ช่วงเวลา</th>
                      <th className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">จำนวนวัน</th>
                      <th className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right pr-8">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          ไม่พบข้อมูล
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map(req => {
                        const user = getUserFromRequest(req);
                        const typeColor = getLeaveTypeColor(req.type);
                        const statusColor = getStatusColor(req.status);
                        return (
                          <tr
                            key={req.id}
                            className="group hover:bg-blue-50/50 transition-colors border-b border-slate-100"
                          >
                            <td className="p-5 pl-8">
                              <div className="flex items-center gap-3">
                                {user?.avatar ? (
                                  <img src={user.avatar} alt={req.userName} className="w-8 h-8 rounded-full border border-slate-100" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                    {getUserInitials(req.userName)}
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-slate-700">{req.userName}</div>
                                  <div className="text-[10px] text-slate-400">ID: {req.userId.substring(0, 8)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-5 text-slate-500">{req.department}</td>
                            <td className="p-5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${typeColor.bg} ${typeColor.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${typeColor.dot}`}></span>
                                {t(`type.${req.type}`)}
                              </span>
                            </td>
                            <td className="p-5 text-slate-500">
                              {formatDate(req.startDate)} {req.startDate !== req.endDate ? `- ${formatDate(req.endDate)}` : ''}
                            </td>
                            <td className="p-5 text-center font-medium text-slate-700">{req.daysCount}</td>
                            <td className="p-5 text-right pr-8">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                                {t(`status.${req.status}`)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {filteredRequests.length > 0 && (
                <div className="p-4 bg-white flex justify-center border-t border-slate-100">
                  <div className="flex gap-1">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50">
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-medium text-sm">1</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 text-sm">2</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 text-sm">3</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50">
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- INDIVIDUAL REPORT VIEW --- */}
        {activeTab === 'INDIVIDUAL' && (
          <div className="space-y-6">
            {/* Employee & Year Selector */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="p-[2px] rounded-2xl bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 shadow-sm w-full sm:w-64">
                  <div className="bg-white rounded-[14px] h-full">
                    <select
                      className="w-full bg-transparent border-none rounded-[14px] py-3 pl-4 pr-10 text-slate-700 focus:ring-0 cursor-pointer text-sm font-medium"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                    >
                      <option value="">เลือกพนักงาน</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="p-[2px] rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 shadow-sm w-full sm:w-32">
                  <div className="bg-white rounded-[14px] h-full">
                    <select
                      className="w-full bg-transparent border-none rounded-[14px] py-3 pl-4 pr-10 text-slate-700 focus:ring-0 cursor-pointer text-sm font-medium"
                      value={individualFilterYear}
                      onChange={(e) => setIndividualFilterYear(e.target.value)}
                    >
                      {[2023, 2024, 2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="material-symbols-outlined text-green-500">check_circle</span>
                <span>ข้อมูลล่าสุด: {new Date().toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
              </div>
            </div>

            {selectedUser && individualStats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Annual Leave Card */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 relative overflow-hidden text-white shadow-lg shadow-blue-500/20 group">
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                    <div className="absolute right-20 bottom-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-blue-100 text-sm font-medium mb-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">beach_access</span>
                            ลาพักร้อน
                          </h3>
                          <div className="text-5xl font-bold tracking-tight mt-2">
                            {individualStats.annual.remaining} <span className="text-lg font-normal text-blue-200">/ {individualStats.annual.limit}</span>
                          </div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                          <span className="text-xs font-medium">เหลือ {individualStats.annual.remaining} วัน</span>
                        </div>
                      </div>
                      <div className="mt-8">
                        <div className="flex justify-between text-xs text-blue-200 mb-2">
                          <span>ความคืบหน้าการใช้</span>
                          <span>{Math.round((individualStats.annual.used / individualStats.annual.limit) * 100)}%</span>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-3 p-0.5">
                          <div
                            className="bg-white h-2 rounded-full shadow-sm"
                            style={{ width: `${Math.min(100, (individualStats.annual.used / individualStats.annual.limit) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sick Leave Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-soft relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-100 rounded-full opacity-50 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-teal-600 mb-3">
                        <span className="p-2 bg-teal-50 rounded-lg material-symbols-outlined text-[20px]">medical_services</span>
                        <span className="font-medium text-sm">ลาป่วย</span>
                      </div>
                      <div className="mt-4">
                        <div className="text-3xl font-bold text-slate-800">
                          {individualStats.sick.year} <span className="text-sm font-normal text-slate-400">วัน</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">ปี {individualFilterYear}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-xs text-slate-500">เดือนนี้ {individualStats.sick.month} วัน</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500" style={{ width: `${Math.min(100, (individualStats.sick.month / 30) * 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Leave Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-soft relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-orange-100 rounded-full opacity-50 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-orange-500 mb-3">
                        <span className="p-2 bg-orange-50 rounded-lg material-symbols-outlined text-[20px]">person</span>
                        <span className="font-medium text-sm">ลากิจ</span>
                      </div>
                      <div className="mt-4">
                        <div className="text-3xl font-bold text-slate-800">
                          {individualStats.personal.year} <span className="text-sm font-normal text-slate-400">วัน</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">ปี {individualFilterYear}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-xs text-slate-500">เดือนนี้ {individualStats.personal.month} วัน</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, (individualStats.personal.month / 6) * 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* History */}
                <div className="md:col-span-2 lg:col-span-3 bg-white rounded-3xl p-6 shadow-soft border border-slate-100">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400">history</span>
                    ประวัติการลาล่าสุด
                  </h3>
                  <div className="space-y-3">
                    {individualHistory.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">ไม่พบข้อมูล</div>
                    ) : (
                      individualHistory.slice(0, 10).map(req => {
                        const typeColor = getLeaveTypeColor(req.type);
                        const statusColor = getStatusColor(req.status);
                        return (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full ${typeColor.bg} ${typeColor.text} flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-[20px]">
                                  {req.type === LeaveType.ANNUAL ? 'beach_access' :
                                    req.type === LeaveType.SICK ? 'medical_services' :
                                      req.type === LeaveType.PERSONAL ? 'person' : 'event'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-sm text-slate-700">{t(`type.${req.type}`)}</div>
                                <div className="text-xs text-slate-400">
                                  {formatDate(req.startDate)} {req.startDate !== req.endDate ? `- ${formatDate(req.endDate)}` : ''} ({req.daysCount} วัน)
                                </div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 ${statusColor.bg} ${statusColor.text} text-[10px] font-bold rounded-md uppercase`}>
                              {t(`status.${req.status}`)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-purple-50 rounded-3xl p-6 shadow-sm border border-purple-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#d8b4fe_1px,transparent_1px)] [background-size:12px_12px] opacity-30"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-3 text-2xl">🎉</div>
                  <h4 className="font-semibold text-purple-700 text-sm">เลือกพนักงานเพื่อดูรายงาน</h4>
                  <p className="text-xs text-purple-500 mt-1">กรุณาเลือกพนักงานจากเมนูด้านบน</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
