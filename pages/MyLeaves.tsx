
import React, { useState, useMemo } from 'react';
import { useLeaveContext } from '../context/LeaveContext';
import { useLanguage } from '../context/LanguageContext';
import { NewLeaveModal } from '../components/NewLeaveModal';
import { ANNUAL_LEAVE_LIMIT, PUBLIC_HOLIDAY_COUNT } from '../constants';
import { LeaveType } from '../types';

export const MyLeaves: React.FC = () => {
  const { currentUser, requests } = useLeaveContext();
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">{t('my.title')}</h1>
           <p className="text-gray-500 text-sm">{t('my.subtitle')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center"
        >
          <span className="text-xl mr-2">+</span> {t('my.btnRequest')}
        </button>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* Annual Leave */}
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-gray-500">{t('my.card.annual')}</p>
              <div className="flex items-end mt-2">
                 <span className="text-3xl font-bold text-gray-900">{ANNUAL_LEAVE_LIMIT - annualUsed}</span>
                 <span className="text-sm text-gray-400 mb-1 ml-1">/ {ANNUAL_LEAVE_LIMIT} {t('my.unit.daysLeft')}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(annualUsed / ANNUAL_LEAVE_LIMIT) * 100}%` }}></div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-xs text-gray-500">
               <span>{t('my.stat.thisMonth')}: <b>{annualStats.month}</b></span>
               <span>{t('my.stat.used')}: <b>{annualUsed}</b></span>
            </div>
         </div>

         {/* Public Holiday */}
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('my.card.public')}</p>
              <div className="flex items-end mt-2">
                  <span className="text-3xl font-bold text-gray-900">{PUBLIC_HOLIDAY_COUNT - publicUsed}</span>
                  <span className="text-sm text-gray-400 mb-1 ml-1">/ {PUBLIC_HOLIDAY_COUNT} {t('my.unit.daysLeft')}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(publicUsed / PUBLIC_HOLIDAY_COUNT) * 100}%` }}></div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-xs text-gray-500">
               <span>{t('my.stat.thisMonth')}: <b>{publicStats.month}</b></span>
               <span>{t('my.stat.used')}: <b>{publicUsed}</b></span>
            </div>
         </div>

         {/* Personal Leave */}
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('my.card.personal')}</p>
              <div className="flex items-end mt-2">
                  <span className="text-3xl font-bold text-gray-900">{personalStats.year}</span>
                  <span className="text-sm text-gray-400 mb-1 ml-1">{t('my.unit.daysYear')}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Unlimited quota</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-500">
               <span>{t('my.stat.thisMonth')}: <b className="text-gray-800">{personalStats.month} {t('my.unit.days')}</b></span>
            </div>
         </div>

         {/* Sick Leave */}
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('my.card.sick')}</p>
              <div className="flex items-end mt-2">
                  <span className="text-3xl font-bold text-gray-900">{sickStats.year}</span>
                  <span className="text-sm text-gray-400 mb-1 ml-1">{t('my.unit.daysYear')}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Unlimited quota</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-500">
               <span>{t('my.stat.thisMonth')}: <b className="text-gray-800">{sickStats.month} {t('my.unit.days')}</b></span>
            </div>
         </div>
      </div>

      {/* Request History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{t('my.history')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">{t('my.table.type')}</th>
                <th 
                  scope="col" 
                  className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                  onClick={toggleSort}
                  title="Click to sort"
                >
                  <div className="flex items-center gap-1">
                    {t('my.table.dates')}
                    <span className={`text-gray-400 text-[10px] transform transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-3">{t('my.table.duration')}</th>
                <th scope="col" className="px-6 py-3">{t('my.table.reason')}</th>
                <th scope="col" className="px-6 py-3">{t('my.table.status')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedRequests.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-8 text-center text-gray-400">{t('my.empty')}</td>
                 </tr>
              ) : (
                sortedRequests.map((req) => (
                  <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{t(`type.${req.type}`)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{req.startDate} <span className="text-gray-400 mx-1">to</span> {req.endDate}</td>
                    <td className="px-6 py-4">{req.daysCount} {t('my.unit.days')}</td>
                    <td className="px-6 py-4 truncate max-w-xs">{req.reason || '-'}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
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

      <NewLeaveModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
