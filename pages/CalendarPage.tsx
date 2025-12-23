import React, { useState } from 'react';
import { useLeaveContext } from '../context/LeaveContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { LeaveStatus, LeaveType } from '../types.ts';

export const CalendarPage: React.FC = () => {
  const { requests, departments } = useLeaveContext();
  const { t, language } = useLanguage();
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar Logic
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const blanks = Array.from({ length: firstDay }, (_, i) => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarCells = [...blanks, ...days];

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const getLeavesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return requests.filter(r => 
      r.status === LeaveStatus.APPROVED &&
      (filterDept === 'ALL' || r.department === filterDept) &&
      r.startDate <= dateStr && r.endDate >= dateStr
    );
  };

  const monthNames = language === 'TH' 
    ? ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const dayNames = language === 'TH'
    ? ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getLeaveColor = (type: LeaveType) => {
    switch (type) {
      case LeaveType.ANNUAL:
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
      case LeaveType.SICK:
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
      case LeaveType.PERSONAL:
        return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' };
      case LeaveType.PUBLIC_HOLIDAY:
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' };
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <h1 className="text-2xl font-bold text-gray-800">{t('cal.title')}</h1>
            
            <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
              <button onClick={prevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="px-4 font-semibold text-gray-700 min-w-[150px] text-center select-none">
                {monthNames[month]} {year}
              </span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div>
            <select 
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 min-w-[160px]"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="ALL">{t('cal.allDepts')}</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 px-1">
          {Object.values(LeaveType).map(type => {
             const style = getLeaveColor(type);
             return (
               <div key={type} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm text-xs font-medium">
                  <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                  <span className="text-gray-600">{t(`type.${type}`)}</span>
               </div>
             )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {dayNames.map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 flex-1 bg-gray-200 gap-px border-b border-gray-200 overflow-y-auto">
          {calendarCells.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="bg-white min-h-[100px]"></div>;
            }

            const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = currentDayStr === todayStr;
            const leaves = getLeavesForDay(day);

            return (
              <div key={day} className={`bg-white min-h-[100px] p-2 transition-colors hover:bg-gray-50 flex flex-col gap-1 ${isToday ? 'bg-blue-50/40' : ''}`}>
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  {leaves.length > 0 && (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 rounded-full">
                      {leaves.length} {t('cal.away')}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col gap-1.5 mt-1 overflow-y-auto custom-scrollbar">
                  {leaves.map(leave => {
                    const style = getLeaveColor(leave.type);
                    return (
                      <div 
                        key={leave.id} 
                        title={`${leave.userName} (${leave.department}) - ${t('type.'+leave.type)}\nReason: ${leave.reason}`}
                        className={`
                          text-xs px-2 py-1.5 rounded-md border shadow-sm truncate cursor-help flex items-center gap-1.5
                          ${style.bg} ${style.text} ${style.border}
                        `}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                        <span className="font-semibold truncate">{leave.userName.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};