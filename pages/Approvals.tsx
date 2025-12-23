import React from 'react';
import { useLeaveContext } from '../context/LeaveContext';
import { useLanguage } from '../context/LanguageContext';
import { LeaveStatus } from '../types';

export const Approvals: React.FC = () => {
  const { requests, updateRequestStatus, currentUser } = useLeaveContext();
  const { t } = useLanguage();

  if (currentUser.role !== 'HR_ADMIN') {
    return <div className="p-10 text-center text-red-500">{t('app.accessDenied')}</div>;
  }

  const pendingRequests = requests.filter(r => r.status === LeaveStatus.PENDING);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('app.title')}</h1>
      
      {pendingRequests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-medium text-gray-900">{t('app.caughtUp')}</h3>
            <p className="text-gray-500">{t('app.noPending')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingRequests.map(req => (
            <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">{req.userName}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{req.department}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-medium text-blue-600">{t(`type.${req.type}`)}</span> • {req.daysCount} {t('my.unit.days')} • {req.startDate} to {req.endDate}
                  </div>
                  {req.reason && (
                    <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded italic border border-gray-100 inline-block">
                      "{req.reason}"
                    </p>
                  )}
               </div>
               
               <div className="flex space-x-3 w-full md:w-auto">
                 <button 
                    onClick={() => updateRequestStatus(req.id, LeaveStatus.REJECTED)}
                    className="flex-1 md:flex-none px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                 >
                   {t('app.btnReject')}
                 </button>
                 <button 
                    onClick={() => updateRequestStatus(req.id, LeaveStatus.APPROVED)}
                    className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition-colors"
                 >
                   {t('app.btnApprove')}
                 </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};