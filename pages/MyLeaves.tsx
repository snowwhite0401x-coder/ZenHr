
import React, { useState, useMemo } from 'react';
import { useLeaveContext } from '../context/LeaveContext';
import { useLanguage } from '../context/LanguageContext';
import { NewLeaveModal } from '../components/NewLeaveModal';
import { LeaveType } from '../types';

export const MyLeaves: React.FC = () => {
  const { currentUser, requests, annualLeaveLimit, publicHolidayCount } = useLeaveContext();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sorting State: Default to newest first (desc)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const myRequests = requests.filter(r => r.userId === currentUser.id);

  // Sorting Logic
  const sortedRequests = useMemo(() => {
    return [...myRequests].sort((a, b) => {
      const dateA = a.startDate;
      const dateB = b.startDate;
      if (dateA < dateB) return sortDirection === 'asc' ? -1 : 1;
      if (dateA > dateB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [myRequests, sortDirection]);

  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const annualUsed = currentUser.annualLeaveUsed;
  const publicUsed = currentUser.publicHolidayUsed || 0;

  // Calculate Month/Year stats
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const isSameMonth = (d: Date) => d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  const isSameYear = (d: Date) => d.getFullYear() === currentYear;

  const getUsage = (type: LeaveType) => {
    const approved = myRequests.filter(r => r.type === type && r.status === 'Approved');
    const yearTotal = approved.filter(r => isSameYear(new Date(r.startDate))).reduce((acc, c) => acc + c.daysCount, 0);
    const monthTotal = approved.filter(r => isSameMonth(new Date(r.startDate))).reduce((acc, c) => acc + c.daysCount, 0);
    return { year: yearTotal, month: monthTotal };
  };

  const annualStats = getUsage(LeaveType.ANNUAL);
  const publicStats = getUsage(LeaveType.PUBLIC_HOLIDAY);
  const personalStats = getUsage(LeaveType.PERSONAL);
  const sickStats = getUsage(LeaveType.SICK);

  return (
    <div className="bg-slate-100/60 min-h-full -mx-4 -mt-4 px-4 py-4 md:px-6 md:py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-800 mb-2 tracking-tight">
              {t('my.title')}
            </h1>
            <p className="text-slate-500 text-base md:text-lg">
              {t('my.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative inline-flex items-center justify-center px-6 md:px-8 py-3.5 text-sm md:text-base font-medium text-white transition-all duration-200 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl hover:shadow-lg hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:scale-95"
          >
            <span className="material-icons-round mr-2 text-xl group-hover:rotate-90 transition-transform duration-300">
              add
            </span>
            {t('my.btnRequest')}
          </button>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Annual leave */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="p-3 bg-orange-100 rounded-2xl text-orange-500">
                <span className="text-2xl">☀️</span>
              </div>
              <h3 className="text-xl font-medium text-slate-800">{t('my.card.annual')}</h3>
            </div>
            <div className="mb-6 relative z-10">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-semibold text-slate-900">
                  {Math.max(0, annualLeaveLimit - annualUsed)}
                </span>
                <span className="text-slate-500 text-sm">
                  / {annualLeaveLimit} {t('my.unit.daysLeft')}
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full shadow-[0_0_10px_rgba(251,146,60,0.5)]"
                  style={{ width: `${Math.min(100, (annualUsed / Math.max(1, annualLeaveLimit)) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm text-slate-500 border-t border-slate-100 pt-4 relative z-10">
              <div className="flex flex-col">
                <span className="text-[11px] mb-1">{t('my.stat.thisMonth')}</span>
                <span className="font-medium text-slate-700">{annualStats.month} {t('my.unit.days')}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[11px] mb-1">{t('my.stat.used')}</span>
                <span className="font-medium text-slate-700">{annualUsed} {t('my.unit.days')}</span>
              </div>
            </div>
          </div>

          {/* Public holiday */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="p-3 bg-purple-100 rounded-2xl text-purple-500">
                <span className="text-2xl">🎉</span>
              </div>
              <h3 className="text-xl font-medium text-slate-800">{t('my.card.public')}</h3>
            </div>
            <div className="mb-6 relative z-10">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-semibold text-slate-900">
                  {Math.max(0, publicHolidayCount - publicUsed)}
                </span>
                <span className="text-slate-500 text-sm">
                  / {publicHolidayCount} {t('my.unit.daysLeft')}
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                  style={{ width: `${Math.min(100, (publicUsed / Math.max(1, publicHolidayCount)) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm text-slate-500 border-t border-slate-100 pt-4 relative z-10">
              <div className="flex flex-col">
                <span className="text-[11px] mb-1">{t('my.stat.thisMonth')}</span>
                <span className="font-medium text-slate-700">{publicStats.month} {t('my.unit.days')}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[11px] mb-1">{t('my.stat.used')}</span>
                <span className="font-medium text-slate-700">{publicUsed} {t('my.unit.days')}</span>
              </div>
            </div>
          </div>

          {/* Personal leave */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="p-3 bg-blue-100 rounded-2xl text-blue-500">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="text-xl font-medium text-slate-800">{t('my.card.personal')}</h3>
            </div>
            <div className="mb-6 relative z-10">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-semibold text-slate-900">{personalStats.year}</span>
                <span className="text-slate-500 text-sm">{t('my.unit.daysYear')}</span>
              </div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {t('my.unlimited')}
              </div>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm text-slate-500 border-t border-slate-100 pt-4 relative z-10">
              <div className="flex flex-col">
                <span className="text-[11px] mb-1">{t('my.stat.thisMonth')}</span>
                <span className="font-medium text-slate-700">
                  {personalStats.month} {t('my.unit.days')}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[11px] mb-1">{t('my.stat.used')}</span>
                <span className="font-medium text-slate-700">
                  {personalStats.year} {t('my.unit.days')}
                </span>
              </div>
            </div>
          </div>

          {/* Sick leave */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="p-3 bg-rose-100 rounded-2xl text-rose-500">
                <span className="text-2xl">➕</span>
              </div>
              <h3 className="text-xl font-medium text-slate-800">{t('my.card.sick')}</h3>
            </div>
            <div className="mb-6 relative z-10">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-semibold text-slate-900">{sickStats.year}</span>
                <span className="text-slate-500 text-sm">{t('my.unit.daysYear')}</span>
              </div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                {t('my.unlimited')}
              </div>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm text-slate-500 border-t border-slate-100 pt-4 relative z-10">
              <div className="flex flex-col">
                <span className="text-[11px] mb-1">{t('my.stat.thisMonth')}</span>
                <span className="font-medium text-slate-700">
                  {sickStats.month} {t('my.unit.days')}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[11px] mb-1">{t('my.stat.used')}</span>
                <span className="font-medium text-slate-700">
                  {sickStats.year} {t('my.unit.days')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* History table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-800">
              {t('my.history')}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm md:text-[15px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs md:text-sm">
                  <th className="py-3.5 px-4 md:px-6 font-medium rounded-tl-2xl">
                    {t('my.table.type')}
                  </th>
                  <th
                    className="py-3.5 px-4 md:px-6 font-medium cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={toggleSort}
                    title={t('my.sortTitle')}
                  >
                    <div className="flex items-center gap-1">
                      {t('my.table.dates')}
                      <span
                        className={`text-slate-400 text-[10px] transform transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''
                          }`}
                      >
                        ▼
                      </span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 md:px-6 font-medium text-center">
                    {t('my.table.duration')}
                  </th>
                  <th className="py-3.5 px-4 md:px-6 font-medium">
                    {t('my.table.reason')}
                  </th>
                  <th className="py-3.5 px-4 md:px-6 font-medium text-right rounded-tr-2xl">
                    {t('my.table.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {sortedRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 px-4 md:px-6 text-center text-slate-400 text-sm"
                    >
                      {t('my.empty')}
                    </td>
                  </tr>
                ) : (
                  sortedRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 md:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${req.type === LeaveType.ANNUAL
                              ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]'
                              : req.type === LeaveType.PUBLIC_HOLIDAY
                                ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                                : req.type === LeaveType.SICK
                                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                                  : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                              }`}
                          />
                          <span className="font-medium">
                            {t(`type.${req.type}`)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 md:px-6 text-sm">
                        <span className="block text-slate-800">
                          {req.startDate}
                        </span>
                        <span className="text-xs text-slate-400">
                          {req.startDate === req.endDate
                            ? t('my.singleDay')
                            : `${t('common.to')} ${req.endDate}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 md:px-6 text-center">
                        <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-sm font-medium">
                          {req.daysCount} {t('my.unit.days')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 md:px-6 text-sm text-slate-500 truncate max-w-xs">
                        {req.reason || '-'}
                      </td>
                      <td className="py-3.5 px-4 md:px-6 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${req.status === 'Approved'
                            ? 'bg-green-100 text-green-700'
                            : req.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${req.status === 'Approved'
                              ? 'bg-green-500'
                              : req.status === 'Pending'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                              } ${req.status === 'Approved' ? 'animate-pulse' : ''}`}
                          />
                          {t(`status.${req.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {sortedRequests.length > 0 && (
              <div className="py-6 text-center text-slate-400 text-xs bg-slate-50/40">
                {t('my.endOfList') || '—'}
              </div>
            )}
          </div>
        </div>

        <NewLeaveModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
};
