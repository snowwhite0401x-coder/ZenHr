import React, { useState, useMemo } from 'react';
import { useLeaveContext } from '../context/LeaveContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { LeaveStatsCard } from '../components/LeaveStatsCard.tsx';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { generateHRInsights } from '../services/geminiService.ts';
import { LeaveType, LeaveStatus } from '../types.ts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export const Dashboard: React.FC = () => {
  const { requests, users } = useLeaveContext();
  const { t } = useLanguage();
  
  const currentYear = new Date().getFullYear();
  const [filterStart, setFilterStart] = useState<string>(`${currentYear}-01-01`);
  const [filterEnd, setFilterEnd] = useState<string>(`${currentYear}-12-31`);
  
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  const periodRequests = useMemo(() => {
    return requests.filter(r => {
      const start = filterStart ? new Date(filterStart) : null;
      const end = filterEnd ? new Date(filterEnd) : null;
      const reqDate = new Date(r.startDate);
      if (start && reqDate < start) return false;
      if (end && reqDate > end) return false;
      return true;
    });
  }, [requests, filterStart, filterEnd]);

  const pendingRequests = periodRequests.filter(r => r.status === LeaveStatus.PENDING).length;
  const approvedRequests = periodRequests.filter(r => r.status === LeaveStatus.APPROVED).length;
  const sickLeaves = periodRequests.filter(r => r.type === LeaveType.SICK).length;
  
  const today = new Date().toISOString().split('T')[0];
  const onLeaveList = requests.filter(r => 
    r.status === LeaveStatus.APPROVED && 
    r.startDate <= today && 
    r.endDate >= today
  );
  const onLeaveToday = onLeaveList.length;

  const typeData = Object.values(LeaveType).map(type => ({
    name: t(`type.${type}`),
    value: periodRequests.filter(r => r.type === type).length
  })).filter(d => d.value > 0);

  const deptDataRaw: Record<string, number> = {};
  periodRequests.forEach(r => {
    deptDataRaw[r.department] = (deptDataRaw[r.department] || 0) + 1;
  });
  const deptData = Object.keys(deptDataRaw).map(k => ({ name: k, count: deptDataRaw[k] }));

  const handleGenerateInsights = async () => {
    setLoadingAi(true);
    const result = await generateHRInsights(periodRequests, users);
    setAiInsight(result);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('dash.title')}</h1>
          <p className="text-slate-500 mt-1">{t('dash.adminView')} — {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60 backdrop-blur-md">
           <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 ml-2">{t('dash.filter.from')}</span>
              <input 
                type="date" 
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)}
                className="text-xs border-none bg-slate-50 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700"
              />
           </div>
           <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('dash.filter.to')}</span>
              <input 
                type="date" 
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)}
                className="text-xs border-none bg-slate-50 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700"
              />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LeaveStatsCard title={t('dash.onLeave')} value={onLeaveToday} icon="🌈" color="bg-indigo-500" />
        <LeaveStatsCard title={t('dash.pending')} value={pendingRequests} icon="⏳" color="bg-amber-500" />
        <LeaveStatsCard title={t('dash.approved')} value={approvedRequests} icon="✨" color="bg-emerald-500" />
        <LeaveStatsCard title={t('dash.sick')} value={sickLeaves} icon="🩹" color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8"></div>
             <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
               {t('dash.trends')}
             </h3>
             <div className="h-72 flex flex-col md:flex-row gap-8">
                <div className="flex-1 relative">
                  <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('dash.byType')}</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                        {typeData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1">
                   <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('dash.byDept')}</p>
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                        <Bar dataKey="count" fill="#6366f1" radius={[10, 10, 10, 10]} barSize={24} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="font-bold text-slate-800 flex items-center gap-3">
                <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl text-lg">🏖️</span> 
                {t('dash.onLeaveList')}
              </h3>
            </div>
            {onLeaveList.length > 0 ? (
              <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto custom-scrollbar">
                {onLeaveList.map(req => (
                  <div key={req.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-inner">
                          {req.userName.charAt(0)}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900">{req.userName}</p>
                          <p className="text-xs text-slate-500 font-medium">{req.department} • <span className="text-indigo-500">{t('type.' + req.type)}</span></p>
                       </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">{req.endDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center">
                <div className="text-5xl mb-4 opacity-20">📭</div>
                <p className="text-slate-400 font-medium italic">{t('dash.noOnLeave')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black tracking-tight flex items-center">
                    <span className="mr-3 animate-pulse">✨</span> {t('dash.ai.title')}
                  </h3>
                  <p className="text-indigo-300/80 text-xs font-medium uppercase tracking-widest mt-1">{t('dash.ai.subtitle')}</p>
                </div>
              </div>
              
              <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-5 text-sm leading-relaxed border border-white/10 min-h-[280px]">
                 {loadingAi ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                       <div className="animate-spin h-10 w-10 border-4 border-indigo-400 border-t-transparent rounded-full shadow-lg"></div>
                       <p className="text-indigo-200 font-bold animate-pulse">{t('dash.ai.analyzing')}</p>
                    </div>
                 ) : aiInsight ? (
                   <div className="whitespace-pre-line text-indigo-50 font-medium drop-shadow-sm">{aiInsight}</div>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">🤖</div>
                      <p className="text-indigo-200/60 italic text-sm">{t('dash.ai.placeholder')}</p>
                   </div>
                 )}
              </div>

              <button 
                onClick={handleGenerateInsights}
                disabled={loadingAi}
                className="mt-6 w-full bg-white text-indigo-900 font-black py-4 px-4 rounded-2xl hover:bg-indigo-50 active:scale-95 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
              >
                 {loadingAi ? t('dash.ai.analyzing') : t('dash.ai.button')}
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
             <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest">{t('dash.recent')}</h3>
             <div className="space-y-6">
               {periodRequests.slice(0, 5).map(req => {
                 const user = users.find(u => u.id === req.userId);
                 const initials = (user?.name || req.userName || '')
                   .split(' ')
                   .filter(Boolean)
                   .map(part => part[0])
                   .join('')
                   .slice(0, 2)
                   .toUpperCase();
                 return (
                   <div key={req.id} className="flex items-center justify-between group cursor-default">
                      <div className="flex items-center gap-3">
                         <div className="relative">
                           <div className={`w-2.5 h-2.5 rounded-full shadow-sm absolute -top-1 -right-1 z-10 ${req.status === 'Approved' ? 'bg-emerald-500' : req.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                           <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm ring-2 ring-white">
                             {user?.avatar ? (
                               <img src={user.avatar} alt={req.userName} className="w-full h-full object-cover" />
                             ) : (
                               <span className="text-xs">{initials || '?'}</span>
                             )}
                           </div>
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{req.userName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{t(`type.${req.type}`)}</p>
                         </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-300">{req.startDate.split('-').slice(1).reverse().join('/')}</span>
                   </div>
                 );
               })}
               {periodRequests.length === 0 && <p className="text-center py-4 text-slate-400 italic text-sm">{t('dash.noActivity')}</p>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};