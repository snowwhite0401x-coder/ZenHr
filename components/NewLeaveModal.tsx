import React, { useState, useEffect } from 'react';
import { LeaveType, LeaveStatus } from '../types.ts';
import { useLeaveContext } from '../context/LeaveContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

export const NewLeaveModal: React.FC<Props> = ({ isOpen, onClose, defaultStartDate, defaultEndDate }) => {
  const { addRequest, currentUser, requests, annualLeaveLimit, publicHolidayCount } = useLeaveContext();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    type: LeaveType.ANNUAL,
    startDate: defaultStartDate || '',
    endDate: defaultEndDate || '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: LeaveType.ANNUAL,
        startDate: defaultStartDate || '',
        endDate: defaultEndDate || defaultStartDate || '',
        reason: '',
      });
    }
  }, [isOpen, defaultStartDate, defaultEndDate]);
  // สำหรับ NOTE type ให้ startDate และ endDate เป็นวันเดียวกัน
  useEffect(() => {
    if (formData.type === LeaveType.NOTE && formData.startDate && formData.endDate !== formData.startDate) {
      setFormData(prev => ({ ...prev, endDate: formData.startDate }));
    }
  }, [formData.type, formData.startDate, formData.endDate]);

  // คำนวณจำนวนวันลา (ไม่นับวันอาทิตย์)
  // สำหรับ NOTE type ไม่ต้องคำนวณวันลา (ใช้ 0 วัน)
  const calculateDays = (start: string, end: string, type: LeaveType) => {
    if (type === LeaveType.NOTE) return 0; // โน้ตไม่นับเป็นวันลา
    
    if (!start || !end) return 0;
    const s = new Date(start + 'T00:00:00'); // ใช้เวลาเที่ยงคืนเพื่อหลีกเลี่ยงปัญหา timezone
    const e = new Date(end + 'T00:00:00');

    let count = 0;
    const current = new Date(s);

    // วนลูปจากวันเริ่มต้นถึงวันสิ้นสุด
    while (current <= e) {
      const dayOfWeek = current.getDay(); // 0 = อาทิตย์, 1 = จันทร์, ..., 6 = เสาร์
      // ไม่นับเฉพาะวันอาทิตย์ (0) เท่านั้น
      if (dayOfWeek !== 0) {
        count++;
      }
      // เพิ่ม 1 วัน
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  const daysCount = calculateDays(formData.startDate, formData.endDate, formData.type);

  // Calculate remaining balance dynamically based on selected Start Date's Year
  const selectedYear = formData.startDate ? new Date(formData.startDate).getFullYear() : new Date().getFullYear();

  const getUsedInYear = (type: LeaveType) => {
    if (!currentUser) return 0;
    return requests
      .filter(r =>
        r.userId === currentUser.id &&
        r.status !== LeaveStatus.REJECTED &&
        r.type === type &&
        new Date(r.startDate).getFullYear() === selectedYear
      )
      .reduce((sum, r) => sum + r.daysCount, 0);
  };

  const usedAnnual = getUsedInYear(LeaveType.ANNUAL);
  const usedPublic = getUsedInYear(LeaveType.PUBLIC_HOLIDAY);

  if (!isOpen) return null;
  if (!currentUser) return null; // ป้องกัน error เมื่อ currentUser เป็น null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.startDate) {
      setError(t('modal.err.dates'));
      return;
    }
    // สำหรับ NOTE type ไม่ต้องตรวจสอบ endDate
    if (formData.type !== LeaveType.NOTE) {
      if (!formData.endDate) {
        setError(t('modal.err.dates'));
        return;
      }
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        setError(t('modal.err.endBeforeStart'));
        return;
      }
    }

    setLoading(true);
    // Simulate network delay
    setTimeout(async () => {
      const result = await addRequest({
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.type === LeaveType.NOTE ? formData.startDate : formData.endDate, // สำหรับ NOTE ให้ endDate = startDate
        daysCount: daysCount,
        reason: formData.reason
      });

      setLoading(false);
      if (result.success) {
        setFormData({ type: LeaveType.ANNUAL, startDate: '', endDate: '', reason: '' });
        onClose();
      } else {
        setError(result.message);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-semibold text-lg">{t('modal.title')}</h2>
          <button onClick={onClose} className="text-white hover:text-blue-200 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('modal.type')}</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as LeaveType })}
              className="w-full border-gray-300 rounded-lg shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.values(LeaveType).map(v => (
                <option key={v} value={v}>{t(`type.${v}`)}</option>
              ))}
            </select>
            {formData.type === LeaveType.ANNUAL && (
              <p className="text-xs text-orange-500 mt-1">
                {selectedYear} {t('modal.balance')}: {Math.max(0, annualLeaveLimit - usedAnnual)} / {annualLeaveLimit} {t('modal.remaining')}
              </p>
            )}
            {formData.type === LeaveType.PUBLIC_HOLIDAY && (
              <p className="text-xs text-orange-500 mt-1">
                {selectedYear} {t('modal.balance')}: {Math.max(0, publicHolidayCount - usedPublic)} / {publicHolidayCount} {t('modal.remaining')}
              </p>
            )}
            {formData.type === LeaveType.NOTE && (
              <p className="text-xs text-blue-500 mt-1">
                {t('modal.noteHint')}
              </p>
            )}
          </div>

          <div className={formData.type === LeaveType.NOTE ? "grid grid-cols-1 gap-4" : "grid grid-cols-2 gap-4"}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === LeaveType.NOTE ? t('modal.noteDate') : t('modal.startDate')}
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full border-gray-300 rounded-lg shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {formData.type !== LeaveType.NOTE && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('modal.endDate')}</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border-gray-300 rounded-lg shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {daysCount > 0 && formData.type !== LeaveType.NOTE && (
            <div className="text-right text-sm text-gray-600 font-medium">
              {t('modal.duration')}: {daysCount} {daysCount > 1 ? t('modal.days') : t('modal.day')}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.type === LeaveType.NOTE ? t('modal.noteMessage') : t('modal.reason')}
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full border-gray-300 rounded-lg shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
              rows={formData.type === LeaveType.NOTE ? 4 : 3}
              placeholder={formData.type === LeaveType.NOTE ? t('modal.notePlaceholder') : t('modal.placeholder')}
              required
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('modal.btnCancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('modal.btnSubmitting')}
                </>
              ) : t('modal.btnSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};