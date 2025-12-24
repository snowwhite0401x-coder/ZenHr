import React, { useState, useMemo } from 'react';
import { useLeaveContext } from '../context/LeaveContext';
import { useLanguage } from '../context/LanguageContext';
import { LeaveStatus, LeaveType } from '../types';

export const Approvals: React.FC = () => {
  const { requests, updateRequestStatus, currentUser, users } = useLeaveContext();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  if (!currentUser || currentUser.role !== 'HR_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 text-lg font-semibold">{t('app.accessDenied')}</p>
        </div>
      </div>
    );
  }

  const pendingRequests = useMemo(() => {
    let filtered = requests.filter(r => r.status === LeaveStatus.PENDING);

    // Filter by type
    if (filterType !== 'ALL') {
      filtered = filtered.filter(r => r.type === filterType);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.userName.toLowerCase().includes(query) ||
        r.department.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    } else {
      filtered.sort((a, b) => a.userName.localeCompare(b.userName));
    }

    return filtered;
  }, [requests, filterType, searchQuery, sortBy]);

  const getLeaveTypeColor = (type: LeaveType) => {
    switch (type) {
      case LeaveType.ANNUAL:
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
      case LeaveType.SICK:
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case LeaveType.PERSONAL:
        return 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400';
      case LeaveType.PUBLIC_HOLIDAY:
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400';
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    
    if (startDate === endDate) {
      return `${startMonth} ${start.getDate()}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
  };

  const handleApprove = async (id: string) => {
    await updateRequestStatus(id, LeaveStatus.APPROVED);
  };

  const handleReject = async (id: string) => {
    await updateRequestStatus(id, LeaveStatus.REJECTED);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative min-w-0 overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 md:px-6 lg:px-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2632] shrink-0 z-10">
        <div className="flex items-center gap-4 lg:hidden">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Approvals</h2>
        </div>
        <div className="hidden lg:flex items-center flex-1 max-w-xl">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 transition-shadow"
              placeholder="Search for employee, department..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 scroll-smooth">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Title and Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Pending Approvals
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">
                Review and manage {pendingRequests.length} new leave request{pendingRequests.length !== 1 ? 's' : ''}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('ALL')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filterType === 'ALL'
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-blue-600 transform hover:-translate-y-0.5'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span>All Requests</span>
              </button>
              <button
                onClick={() => setFilterType(LeaveType.ANNUAL)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  filterType === LeaveType.ANNUAL
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span>Annual Leave</span>
              </button>
              <button
                onClick={() => setFilterType(LeaveType.SICK)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  filterType === LeaveType.SICK
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span>Sick Leave</span>
              </button>
              <button
                onClick={() => setSortBy(sortBy === 'date' ? 'name' : 'date')}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span>Sort by {sortBy === 'date' ? 'Date' : 'Name'}</span>
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
            </div>
          </div>

          {/* Request Cards */}
          {pendingRequests.length === 0 ? (
            <div className="bg-white dark:bg-[#1a2632] rounded-[2rem] p-16 text-center shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">All caught up!</h3>
              <p className="text-slate-500 dark:text-slate-400">No pending leave requests at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingRequests.map(req => {
                const user = users.find(u => u.id === req.userId);
                const initials = (user?.name || req.userName || '')
                  .split(' ')
                  .filter(Boolean)
                  .map(part => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <article
                    key={req.id}
                    className="bg-white dark:bg-[#1a2632] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col gap-5"
                  >
                    {/* Header with Avatar and Type */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 ring-2 ring-primary/10 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          {user?.avatar ? (
                            <img src={user.avatar} alt={req.userName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-slate-600">{initials || '?'}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                            {req.userName}
                          </h3>
                          <p className="text-xs font-semibold text-primary uppercase tracking-wide mt-0.5">
                            {req.department}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getLeaveTypeColor(req.type)}`}>
                        {req.type === LeaveType.ANNUAL ? 'Annual' : 
                         req.type === LeaveType.SICK ? 'Sick Leave' :
                         req.type === LeaveType.PERSONAL ? 'Personal' :
                         req.type === LeaveType.PUBLIC_HOLIDAY ? 'Public Holiday' : req.type}
                      </span>
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                      <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
                      <span className="text-sm font-medium">{formatDateRange(req.startDate, req.endDate)}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 mx-1"></span>
                      <span className="text-sm font-medium">
                        {req.daysCount} {req.daysCount === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>

                    {/* Reason */}
                    {req.reason && (
                      <div className="bg-primary/5 dark:bg-slate-800/50 p-4 rounded-[1.25rem_1.25rem_1.25rem_0.25rem]">
                        <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                          "{req.reason}"
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
                      <button
                        onClick={() => handleReject(req.id)}
                        className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary to-blue-400 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 hover:to-blue-500 transition-all"
                      >
                        Approve
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
