import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLeaveContext } from '../context/LeaveContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { LeaveStatus, LeaveType, LeaveRequest } from '../types.ts';
import { NewLeaveModal } from '../components/NewLeaveModal.tsx';

export const CalendarPage: React.FC = () => {
  const { requests, departments, users } = useLeaveContext();
  const { t, language } = useLanguage();
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'LIST'>('MONTH');
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar Logic
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  // Week calculation
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday = 0
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (date: Date): Date[] => {
    const start = getWeekStart(date);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

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

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const getLeavesForDate = (dateStr: string): { leaves: LeaveRequest[]; notes: LeaveRequest[] } => {
    const allItems = requests.filter(r => {
      // สำหรับ NOTE type แสดงเฉพาะเมื่อ startDate ตรงกับ dateStr เท่านั้น
      if (r.type === LeaveType.NOTE) {
        return r.status === LeaveStatus.APPROVED &&
          (filterDept === 'ALL' || r.department === filterDept) &&
          (filterType === 'ALL' || r.type === filterType) &&
          r.startDate === dateStr;
      }
      // สำหรับประเภทอื่นๆ ใช้ logic เดิม
      return r.status === LeaveStatus.APPROVED &&
        (filterDept === 'ALL' || r.department === filterDept) &&
        (filterType === 'ALL' || r.type === filterType) &&
        r.startDate <= dateStr && r.endDate >= dateStr;
    });

    // แยก NOTE type ออกจาก leaves
    const leaves = allItems.filter(r => r.type !== LeaveType.NOTE);
    const notes = allItems.filter(r => r.type === LeaveType.NOTE);

    return { leaves, notes };
  };

  const getLeavesForDay = (day: number): { leaves: LeaveRequest[]; notes: LeaveRequest[] } => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return getLeavesForDate(dateStr);
  };

  // Filtered requests for List view
  const filteredRequests = useMemo(() => {
    return requests.filter(r =>
      r.status === LeaveStatus.APPROVED &&
      (filterDept === 'ALL' || r.department === filterDept) &&
      (filterType === 'ALL' || r.type === filterType)
    ).sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return dateA - dateB;
    });
  }, [requests, filterDept, filterType]);

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
      case LeaveType.NOTE:
        return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' };
    }
  };

  const openNewLeaveForDate = (dateStr?: string) => {
    setSelectedDate(dateStr || null);
    setIsModalOpen(true);
  };

  const formatDateStr = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const renderLeaveItem = (leave: LeaveRequest) => {
    const style = getLeaveColor(leave.type);
    const user = users.find(u => u.id === leave.userId);
    const initials = (user?.name || leave.userName || '')
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const isNote = leave.type === LeaveType.NOTE;

    return (
      <div
        key={leave.id}
        title={`${leave.userName} (${leave.department}) - ${t('type.' + leave.type)}${isNote ? '\nNote: ' + leave.reason : '\nReason: ' + leave.reason}`}
        className={`
          text-xs px-2 py-1.5 rounded-md border shadow-sm cursor-pointer flex items-center gap-2
          ${style.bg} ${style.text} ${style.border}
        `}
      >
        {/* แสดงรูปโปรไฟล์สำหรับทุกประเภท รวมถึง NOTE */}
        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-[10px] font-bold text-white shrink-0 ring-2 ring-white">
          {user?.avatar ? (
            <img src={user.avatar} alt={leave.userName} className="w-full h-full object-cover" />
          ) : (
            <span>{initials || '?'}</span>
          )}
        </div>

        {isNote ? (
          <>
            <span className="text-orange-500 text-sm">⭐</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 truncate">{leave.userName.split(' ')[0]}</div>
              <div className="text-[10px] text-slate-600 truncate">{leave.reason || t('type.Note / Activity Notification')}</div>
            </div>
          </>
        ) : (
          <span className="font-semibold truncate">{leave.userName.split(' ')[0]}</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('cal.title')}</h1>
              <p className="text-xs text-gray-500 mt-1">{t('cal.subtitle') || ''}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200 shadow-inner">
                <button
                  onClick={viewMode === 'MONTH' ? prevMonth : prevWeek}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="px-4 font-semibold text-gray-700 min-w-[150px] text-center select-none">
                  {viewMode === 'MONTH'
                    ? `${monthNames[month]} ${year}`
                    : viewMode === 'WEEK'
                      ? `${weekDays[0].getDate()} ${monthNames[weekDays[0].getMonth()]} - ${weekDays[6].getDate()} ${monthNames[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`
                      : `${monthNames[month]} ${year}`
                  }
                </span>
                <button
                  onClick={viewMode === 'MONTH' ? nextMonth : nextWeek}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                วันนี้
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative">
              <select
                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-44 px-3 py-2.5 shadow-sm"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                <option value="ALL">{t('cal.allDepts')}</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${showFilters || filterType !== 'ALL'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${filterType !== 'ALL' ? 'bg-indigo-500' : 'bg-green-500'}`} />
                  Filters
                </button>
                {showFilters && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-50 min-w-[200px]">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-700 block">ประเภทการลา</label>
                      <select
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        value={filterType}
                        onChange={(e) => {
                          setFilterType(e.target.value);
                          setShowFilters(false);
                        }}
                      >
                        <option value="ALL">ทั้งหมด</option>
                        {Object.values(LeaveType).map(type => (
                          <option key={type} value={type}>{t(`type.${type}`)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => openNewLeaveForDate()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-indigo-400"
              >
                <span className="text-lg">＋</span>
                {t('my.btnRequest')}
              </button>
            </div>
          </div>
        </div>

        {/* Legend & view mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex flex-wrap gap-2">
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

          <div className="flex items-center">
            <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs font-medium text-gray-500">
              {['MONTH', 'WEEK', 'LIST'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode as any)}
                  className={`px-3 py-1 rounded-full transition-colors ${viewMode === mode
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {mode === 'MONTH' ? 'Month' : mode === 'WEEK' ? 'Week' : 'List'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-gray-200 overflow-hidden flex-1 flex flex-col">
        {viewMode === 'MONTH' && (
          <>
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
              {dayNames.map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-1 bg-gray-100 gap-px border-b border-gray-200 overflow-y-auto">
              {calendarCells.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="bg-white min-h-[100px]"></div>;
                }

                const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = currentDayStr === todayStr;
                const { leaves, notes } = getLeavesForDay(day);

                return (
                  <div key={day} className={`bg-white min-h-[110px] p-2 transition-colors hover:bg-gray-50 flex flex-col gap-1 group`}>
                    <div className={`flex justify-between items-start ${isToday ? 'bg-indigo-50/60 rounded-xl -m-2 mb-1 p-2 pb-1' : ''}`}>
                      <span className={`text-sm font-semibold h-8 w-8 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
                        {day}
                      </span>
                      <div className="flex items-center gap-1">
                        {leaves.length > 0 && (
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 rounded-full">
                          {leaves.length} {t('cal.away')}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => openNewLeaveForDate(currentDayStr)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 mt-1 overflow-y-auto custom-scrollbar">
                      {/* แสดงการลาก่อน */}
                      {leaves.map(leave => renderLeaveItem(leave))}
                      {/* แสดงโน้ต/แจ้งเตือนทีหลัง */}
                      {notes.map(note => renderLeaveItem(note))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'WEEK' && (
          <>
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
              {weekDays.map((date, idx) => {
                const dayName = dayNames[date.getDay()];
                const dayNum = date.getDate();
                const dateStr = formatDateStr(date);
                const isToday = dateStr === todayStr;
                return (
                  <div key={idx} className="py-3 text-center border-r border-gray-200 last:border-r-0">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{dayName}</div>
                    <div className={`text-sm font-bold ${isToday ? 'bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto' : 'text-gray-700'}`}>
                      {dayNum}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-7 flex-1 bg-gray-100 gap-px overflow-y-auto">
              {weekDays.map((date, idx) => {
                const dateStr = formatDateStr(date);
                const isToday = dateStr === todayStr;
                const { leaves, notes } = getLeavesForDate(dateStr);

                return (
                  <div key={idx} className={`bg-white min-h-[200px] p-3 transition-colors hover:bg-gray-50 flex flex-col gap-2 group ${isToday ? 'ring-2 ring-indigo-500' : ''}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">
                        {leaves.length > 0 && `${leaves.length} ${t('cal.away')}`}
                        {leaves.length > 0 && notes.length > 0 && ' • '}
                        {notes.length > 0 && `${notes.length} โน้ต`}
                        {leaves.length === 0 && notes.length === 0 && 'ไม่มีกิจกรรม'}
                      </span>
                      <button
                        type="button"
                        onClick={() => openNewLeaveForDate(dateStr)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar">
                      {/* แสดงการลาก่อน */}
                      {leaves.map(leave => renderLeaveItem(leave))}
                      {/* แสดงโน้ต/แจ้งเตือนทีหลัง */}
                      {notes.map(note => renderLeaveItem(note))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'LIST' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">ไม่พบข้อมูลการลา</p>
                </div>
              ) : (
                filteredRequests.map(leave => {
                  const style = getLeaveColor(leave.type);
                  const user = users.find(u => u.id === leave.userId);
                  const startDate = new Date(leave.startDate);
                  const endDate = new Date(leave.endDate);
                  const initials = (user?.name || leave.userName || '')
                    .split(' ')
                    .filter(Boolean)
                    .map(part => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={leave.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shrink-0">
                          {user?.avatar ? (
                            <img src={user.avatar} alt={leave.userName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-gray-600">{initials || '?'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{leave.userName}</h3>
                              <p className="text-xs text-gray-500">{leave.department}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-xs font-medium ${style.bg} ${style.text} ${style.border} border`}>
                              {t(`type.${leave.type}`)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {startDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} - {endDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {leave.daysCount} วัน
                            </span>
                          </div>
                          {leave.reason && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{leave.reason}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <NewLeaveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultStartDate={selectedDate || undefined}
        defaultEndDate={selectedDate || undefined}
      />
    </div>
  );
};