import React, { useState } from 'react';
import { useLeaveContext } from '../context/LeaveContext';
import { useLanguage } from '../context/LanguageContext';

export const Profile: React.FC = () => {
  const { currentUser, updateUser } = useLeaveContext();
  const { t } = useLanguage();

  if (!currentUser) return null;

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username || '');
  const [password, setPassword] = useState(currentUser.password || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    updateUser(currentUser.id, { name, username, password });

    setSaving(false);
    setMessage(t('profile.saved'));
  };

  return (
    <div className="mx-auto max-w-5xl px-2 sm:px-4 lg:px-0 py-4 sm:py-6 lg:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {t('profile.title')}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {t('profile.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: avatar & summary */}
        <div className="lg:col-span-1">
          <div className="bg-white/90 rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="relative mb-2">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 overflow-hidden rounded-full border-[6px] border-white bg-slate-100 shadow-lg">
                  {/* ใช้ avatar จากระบบ ถ้าไม่มีให้ fallback เป็นตัวอักษรแรกของชื่อ */}
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-indigo-500">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {currentUser.name}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-indigo-500 uppercase tracking-wide">
                {currentUser.role === 'HR_ADMIN' ? 'Super Admin' : t('role.employee')}
              </p>

              <div className="w-full mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">{t('set.user.dept')}</span>
                  <span className="font-semibold text-slate-900">
                    {currentUser.department}
                  </span>
                </div>
                <div className="h-px w-full bg-slate-200/60" />
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Username</span>
                  <span className="font-semibold text-slate-900">
                    {currentUser.username || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white/80 rounded-3xl p-2 shadow-sm flex overflow-x-auto">
            <button className="flex-1 whitespace-nowrap rounded-2xl bg-indigo-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-indigo-600">
              Personal Info
            </button>
            <button className="flex-1 whitespace-nowrap rounded-2xl bg-transparent px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-500 hover:bg-slate-50">
              Login Details
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white/95 rounded-[1.75rem] p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6"
          >
            {message && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-2xl">
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-slate-800">
                  {t('profile.name')}
                </label>
                <input
                  type="text"
                  className="block w-full rounded-2xl border-0 bg-slate-50 py-3 px-4 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-slate-800">
                  {t('profile.username')}
                </label>
                <input
                  type="text"
                  className="block w-full rounded-2xl border-0 bg-slate-50 py-3 px-4 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs sm:text-sm font-semibold text-slate-800">
                  {t('profile.password')}
                </label>
                <input
                  type="password"
                  className="block w-full rounded-2xl border-0 bg-slate-50 py-3 px-4 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="mt-1 text-[11px] sm:text-xs text-slate-400">
                  {t('profile.passwordNote')}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setName(currentUser.name);
                  setUsername(currentUser.username || '');
                  setPassword(currentUser.password || '');
                  setMessage(null);
                }}
                className="rounded-2xl px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 hover:bg-slate-100"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 sm:px-7 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-60"
              >
                {saving ? t('profile.saving') : t('profile.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

