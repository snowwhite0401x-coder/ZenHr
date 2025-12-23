import React, { useState } from 'react';
import { useLeaveContext } from '../context/LeaveContext';
import { useLanguage } from '../context/LanguageContext';

export const Profile: React.FC = () => {
  const { currentUser, updateUser } = useLeaveContext();
  const { t } = useLanguage();

  if (!currentUser) {
    return null;
  }

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
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('profile.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('profile.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg">
            {message}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile.name')}
          </label>
          <input
            type="text"
            className="w-full border rounded-lg p-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile.username')}
          </label>
          <input
            type="text"
            className="w-full border rounded-lg p-2 text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile.password')}
          </label>
          <input
            type="password"
            className="w-full border rounded-lg p-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-gray-400">
            {t('profile.passwordNote')}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t('profile.saving') : t('profile.save')}
          </button>
        </div>
      </form>
    </div>
  );
};


