
import React, { useState, useMemo } from 'react';
import { useLeaveContext } from '../context/LeaveContext';
import { useLanguage } from '../context/LanguageContext';
import { LeaveType, LeaveStatus, LeaveRequest } from '../types';
import { ANNUAL_LEAVE_LIMIT, PUBLIC_HOLIDAY_COUNT } from '../constants';

export const Reports: React.FC = () => {
  const { requests, departments, currentUser, permissions, users } = useLeaveContext();
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
      // Changed to filter by Start Date instead of CreatedAt
      // This ensures 2026 leaves booked in 2025 appear in 2026 report
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
      t('rep.table.date'),
      t('rep.table.name'),
      t('rep.table.dept'),
      t('rep.table.type'),
      t('rep.table.period'),
      t('rep.table.days'),
      t('rep.table.reason'),
      t('rep.table.status')
    ];

    const rows = filteredRequests.map(req => {
        // Escape quotes in reason
        const safeReason = req.reason ? `"${req.reason.replace(/"/g, '""')}"` : '""';
        return [
            req.createdAt.split('T')[0],
            `"${req.userName}"`,
            req.department,
            `"${t('type.' + req.type)}"`, // Translate type for report
            `${req.startDate} - ${req.endDate}`,
            req.daysCount,
            safeReason,
            t(`status.${req.status}`)
        ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n'); // Add BOM for Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leave_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- INDIVIDUAL REPORT LOGIC ---
  const selectedUser = users.find(u => u.id === selectedUserId);
  
  const individualStats = useMemo(() => {
    if (!selectedUser) return null;
    
    // Get requests for this user, approved only for stats
    const userRequests = requests.filter(r => r.userId === selectedUser.id && r.status === LeaveStatus.APPROVED);
    
    // Current Date context
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const selectedYearNum = parseInt(individualFilterYear);

    // Helper to safely parse YYYY-MM-DD to local date
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

    // Initialize stats structure
    const stats = {
        totalThisMonth: 0,
        totalThisYear: 0,
        annual: {
            used: 0, 
            limit: ANNUAL_LEAVE_LIMIT,
            remaining: ANNUAL_LEAVE_LIMIT 
        },
        publicHoliday: {
            used: 0,
            limit: PUBLIC_HOLIDAY_COUNT,
            remaining: PUBLIC_HOLIDAY_COUNT
        },
        sick: { month: 0, year: 0 },
        personal: { month: 0, year: 0 }
    };

    // Calculate in one pass
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

    // Update remaining based on calculated usage for that year
    stats.annual.remaining = Math.max(0, stats.annual.limit - stats.annual.used);
    stats.publicHoliday.remaining = Math.max(0, stats.publicHoliday.limit - stats.publicHoliday.used);

    return stats;
  }, [selectedUser, requests, selectedUserId, individualFilterYear]); 

  const individualHistory = useMemo(() => {
     if (!selectedUserId) return [];
     const selectedYearNum = parseInt(individualFilterYear);
     
     return requests
        .filter(r => {
            if (r.userId !== selectedUserId) return false;
            // Filter by START DATE year instead of CREATED AT year
            // This ensures that if a user books leave for 2026 in 2025, it shows up in the 2026 report.
            const reqYear = r.startDate ? parseInt(r.startDate.split('-')[0]) : 0;
            return reqYear === selectedYearNum;
        })
        .sort((a,b) => {
            // Sort by Start Date Descending
            const dateA = a.startDate || '';
            const dateB = b.startDate || '';
            return dateB.localeCompare(dateA);
        });
  }, [selectedUserId, requests, individualFilterYear]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">{t('rep.title')}</h1>
           <p className="text-gray-500 text-sm">{t('rep.subtitle')}</p>
        </div>
        {activeTab === 'GENERAL' && (
          <button 
            onClick={downloadCSV}
            disabled={filteredRequests.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-2">📄</span> {t('rep.btn.download')}
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'GENERAL' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('rep.tab.general')}
        </button>
        <button
          onClick={() => setActiveTab('INDIVIDUAL')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'INDIVIDUAL' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('rep.tab.individual')}
        </button>
      </div>

      {/* --- GENERAL REPORT VIEW --- */}
      {activeTab === 'GENERAL' && (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center animate-fade-in">
             
             <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">{t('rep.filter.year')}</label>
                <select 
                   className="border border-gray-300 rounded-lg p-2 text-sm min-w-[100px]"
                   value={filterYear}
                   onChange={(e) => setFilterYear(e.target.value)}
                >
                  <option value="ALL">{t('rep.filter.all')}</option>
                  {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
             </div>

             <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">{t('rep.filter.month')}</label>
                <select 
                   className="border border-gray-300 rounded-lg p-2 text-sm min-w-[120px]"
                   value={filterMonth}
                   onChange={(e) => setFilterMonth(e.target.value)}
                >
                  <option value="ALL">{t('rep.filter.all')}</option>
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                     <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
             </div>

             <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">{t('rep.filter.dept')}</label>
                <select 
                   className="border border-gray-300 rounded-lg p-2 text-sm min-w-[150px]"
                   value={filterDept}
                   onChange={(e) => setFilterDept(e.target.value)}
                >
                  <option value="ALL">{t('rep.filter.all')}</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
             </div>

             <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">{t('rep.filter.type')}</label>
                <select 
                   className="border border-gray-300 rounded-lg p-2 text-sm min-w-[150px]"
                   value={filterType}
                   onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="ALL">{t('rep.filter.all')}</option>
                  {Object.values(LeaveType).map(v => <option key={v} value={v}>{t('type.' + v)}</option>)}
                </select>
             </div>
             
             <div className="ml-auto text-sm text-gray-500 self-end pb-2">
                Found: <b>{filteredRequests.length}</b> records
             </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">{t('rep.table.date')}</th>
                    <th className="px-6 py-3">{t('rep.table.name')}</th>
                    <th className="px-6 py-3">{t('rep.table.dept')}</th>
                    <th className="px-6 py-3">{t('rep.table.type')}</th>
                    <th className="px-6 py-3">{t('rep.table.period')}</th>
                    <th className="px-6 py-3">{t('rep.table.days')}</th>
                    <th className="px-6 py-3">{t('rep.table.reason')}</th>
                    <th className="px-6 py-3">{t('rep.table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-400">{t('rep.noData')}</td>
                    </tr>
                  ) : (
                    filteredRequests.map(req => (
                      <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{req.createdAt.split('T')[0]}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{req.userName}</td>
                        <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded text-xs border bg-gray-50 border-gray-200">{req.department}</span>
                        </td>
                        <td className="px-6 py-4">{t('type.' + req.type)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{req.startDate} <span className="text-gray-400">to</span> {req.endDate}</td>
                        <td className="px-6 py-4 font-semibold">{req.daysCount}</td>
                        <td className="px-6 py-4 truncate max-w-[150px]" title={req.reason}>{req.reason || '-'}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                              req.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' :
                              req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-red-100 text-red-800 border-red-200'
                           }`}>
                             {t(`status.${req.status}`)}
                           </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- INDIVIDUAL SUMMARY VIEW --- */}
      {activeTab === 'INDIVIDUAL' && (
        <div className="space-y-6 animate-fade-in">
           {/* Employee & Year Selector */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('rep.ind.selectUser')}</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                    <option value="">{t('rep.ind.selectPlaceholder')}</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                    ))}
                </select>
              </div>
              <div className="w-full md:w-48">
                 <label className="block text-sm font-semibold text-gray-700 mb-2">{t('rep.filter.year')}</label>
                 <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={individualFilterYear}
                    onChange={(e) => setIndividualFilterYear(e.target.value)}
                 >
                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
              </div>
           </div>

           {selectedUser && individualStats ? (
              <>
                 {/* Overall Stats Cards */}
                 <h3 className="text-lg font-bold text-gray-800">{t('rep.ind.stats')} ({individualFilterYear})</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                     {/* Annual Balance */}
                     <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl">🏖️</div>
                        <h4 className="text-gray-500 text-sm font-medium mb-1">{t('type.Annual Leave')}</h4>
                        <div className="flex items-baseline gap-2">
                           <span className="text-3xl font-bold text-gray-900">{individualStats.annual.remaining}</span>
                           <span className="text-xs text-gray-500">{t('rep.ind.remaining')}</span>
                        </div>
                        <div className="mt-3 text-xs text-gray-500 flex justify-between border-t pt-2">
                           <span>{t('rep.ind.used')}: {individualStats.annual.used}</span>
                           <span>{t('rep.ind.limit')}: {individualStats.annual.limit}</span>
                        </div>
                     </div>

                     {/* Public Holiday Balance */}
                     <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl">🎉</div>
                        <h4 className="text-gray-500 text-sm font-medium mb-1">{t('type.Public Holiday')}</h4>
                        <div className="flex items-baseline gap-2">
                           <span className="text-3xl font-bold text-gray-900">{individualStats.publicHoliday.remaining}</span>
                           <span className="text-xs text-gray-500">{t('rep.ind.remaining')}</span>
                        </div>
                        <div className="mt-3 text-xs text-gray-500 flex justify-between border-t pt-2">
                           <span>{t('rep.ind.used')}: {individualStats.publicHoliday.used}</span>
                           <span>{t('rep.ind.limit')}: {individualStats.publicHoliday.limit}</span>
                        </div>
                     </div>

                     {/* Personal Leave Usage */}
                     <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                        <h4 className="text-gray-500 text-sm font-medium mb-1">{t('type.Personal Leave')}</h4>
                        <div className="space-y-2 mt-2">
                           <div className="flex justify-between text-sm">
                              <span className="text-gray-600">{t('my.stat.thisMonth')}:</span>
                              <span className="font-bold text-gray-900">{individualStats.personal.month ?? 0} {t('rep.ind.days')}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-gray-600">{t('my.stat.thisYear')}:</span>
                              <span className="font-bold text-gray-900">{individualStats.personal.year ?? 0} {t('rep.ind.days')}</span>
                           </div>
                        </div>
                     </div>

                     {/* Sick Leave Usage */}
                     <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
                        <h4 className="text-gray-500 text-sm font-medium mb-1">{t('type.Sick Leave')}</h4>
                         <div className="space-y-2 mt-2">
                           <div className="flex justify-between text-sm">
                              <span className="text-gray-600">{t('my.stat.thisMonth')}:</span>
                              <span className="font-bold text-gray-900">{individualStats.sick.month ?? 0} {t('rep.ind.days')}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-gray-600">{t('my.stat.thisYear')}:</span>
                              <span className="font-bold text-gray-900">{individualStats.sick.year ?? 0} {t('rep.ind.days')}</span>
                           </div>
                        </div>
                     </div>

                     {/* Usage Summary */}
                     <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm bg-gray-50">
                        <h4 className="text-gray-700 text-sm font-bold mb-1">{t('rep.ind.used')} (Total)</h4>
                        <div className="space-y-2 mt-2">
                           <div className="flex justify-between text-sm">
                              <span className="text-gray-600">{t('my.stat.thisMonth')}:</span>
                              <span className="font-bold text-blue-600">{individualStats.totalThisMonth ?? 0} {t('rep.ind.days')}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-gray-600">{t('my.stat.thisYear')}:</span>
                              <span className="font-bold text-blue-600">{individualStats.totalThisYear ?? 0} {t('rep.ind.days')}</span>
                           </div>
                        </div>
                     </div>
                 </div>

                 {/* Detailed History Table */}
                 <h3 className="text-lg font-bold text-gray-800 pt-4">{t('rep.ind.history')}</h3>
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">{t('rep.table.date')}</th>
                                <th className="px-6 py-3">{t('rep.table.type')}</th>
                                <th className="px-6 py-3">{t('rep.table.period')}</th>
                                <th className="px-6 py-3">{t('rep.table.days')}</th>
                                <th className="px-6 py-3">{t('rep.table.reason')}</th>
                                <th className="px-6 py-3">{t('rep.table.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {individualHistory.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">{t('rep.noData')}</td></tr>
                            ) : (
                                individualHistory.map(req => (
                                    <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">{req.createdAt.split('T')[0]}</td>
                                        <td className="px-6 py-4">{t('type.' + req.type)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{req.startDate} to {req.endDate}</td>
                                        <td className="px-6 py-4">{req.daysCount}</td>
                                        <td className="px-6 py-4">{req.reason || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                                req.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' :
                                                req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                'bg-red-100 text-red-800 border-red-200'
                                            }`}>
                                                {t(`status.${req.status}`)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                 </div>
              </>
           ) : (
             <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400">{selectedUserId ? 'No data found.' : t('rep.ind.selectPlaceholder')}</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
};
