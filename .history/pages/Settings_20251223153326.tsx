
import React, { useState, useEffect } from 'react';
import { useLeaveContext } from '../context/LeaveContext';
import { useLanguage } from '../context/LanguageContext';
import { User, AppFeature } from '../types';

export const Settings: React.FC = () => {
  const { users, departments, addUser, updateUser, deleteUser, currentUser, permissions, updatePermission, googleSheetsUrl, saveGoogleSheetsUrl, testGoogleSheetsConnection, sendHeadersToSheet, addDepartment, updateDepartment, deleteDepartment } = useLeaveContext();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'USERS' | 'DEPARTMENTS' | 'PERMISSIONS' | 'INTEGRATIONS'>('USERS');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Department State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptFormName, setDeptFormName] = useState('');
  const [editDeptName, setEditDeptName] = useState<string | null>(null);
  const [deptError, setDeptError] = useState<string | null>(null);

  // Integration State
  const [sheetUrl, setSheetUrl] = useState('');
  const [urlSaved, setUrlSaved] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'SUCCESS' | 'FAIL' | null>(null);
  const [headersAdded, setHeadersAdded] = useState(false);

  useEffect(() => {
    setSheetUrl(googleSheetsUrl);
  }, [googleSheetsUrl]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    department: '',
    role: 'EMPLOYEE' as 'EMPLOYEE' | 'HR_ADMIN'
  });

  if (currentUser?.role !== 'HR_ADMIN') {
    return <div className="p-10 text-center text-red-500">{t('app.accessDenied')}</div>;
  }

  const openAddModal = () => {
    setEditMode(false);
    setFormData({ name: '', username: '', password: '', department: departments[0] || 'IT', role: 'EMPLOYEE' });
    setShowUserModal(true);
  };

  const openEditModal = (user: User) => {
    setEditMode(true);
    setEditingId(user.id);
    setFormData({
        name: user.name,
        username: user.username || '',
        password: user.password || '',
        department: user.department,
        role: user.role
    });
    setShowUserModal(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editMode && editingId) {
        updateUser(editingId, {
            name: formData.name,
            username: formData.username,
            password: formData.password,
            department: formData.department,
            role: formData.role
        });
    } else {
        const generatedId =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).substr(2, 9);

        const user: User = {
            id: generatedId,
            name: formData.name,
            username: formData.username,
            password: formData.password,
            department: formData.department,
            role: formData.role,
            annualLeaveUsed: 0,
            publicHolidayUsed: 0,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
        };
        addUser(user);
    }
    setShowUserModal(false);
  };

  // Department Handlers
  const openAddDeptModal = () => {
    setEditDeptName(null);
    setDeptFormName('');
    setDeptError(null);
    setShowDeptModal(true);
  };

  const openEditDeptModal = (name: string) => {
    setEditDeptName(name);
    setDeptFormName(name);
    setDeptError(null);
    setShowDeptModal(true);
  };

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFormName.trim()) return;

    if (editDeptName) {
        const result = updateDepartment(editDeptName, deptFormName);
        if (!result.success) {
            setDeptError(result.message);
            return;
        }
    } else {
        const result = addDepartment(deptFormName);
        if (!result.success) {
            setDeptError(result.message);
            return;
        }
    }
    setShowDeptModal(false);
  };

  const handleDeleteDept = (name: string) => {
    if (!window.confirm(t('set.dept.confirmDelete').replace('{name}', name))) return;
    const result = deleteDepartment(name);
    if (!result.success) {
        alert(result.message);
    }
  };

  const handleSheetSave = () => {
    saveGoogleSheetsUrl(sheetUrl);
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    const success = await testGoogleSheetsConnection();
    setTestingConnection(false);
    setTestResult(success ? 'SUCCESS' : 'FAIL');
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleAddHeaders = async () => {
    setHeadersAdded(false);
    await sendHeadersToSheet();
    setHeadersAdded(true);
    setTimeout(() => setHeadersAdded(false), 3000);
  };

  const permissionFeatures: { key: AppFeature; label: string }[] = [
    { key: 'VIEW_DASHBOARD', label: t('set.perm.view') },
    { key: 'VIEW_CALENDAR', label: t('set.perm.cal') },
    { key: 'REQUEST_LEAVE', label: t('set.perm.req') },
    { key: 'APPROVE_LEAVE', label: t('set.perm.app') },
    { key: 'VIEW_REPORTS', label: t('set.perm.rep') },
    { key: 'MANAGE_SETTINGS', label: t('set.perm.set') },
  ];

  const isValidUrl = sheetUrl.includes('/exec');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('set.title')}</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'USERS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('set.tab.users')}
        </button>
        <button
          onClick={() => setActiveTab('DEPARTMENTS')}
          className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'DEPARTMENTS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('set.tab.dept')}
        </button>
        <button
          onClick={() => setActiveTab('PERMISSIONS')}
          className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'PERMISSIONS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('set.tab.perm')}
        </button>
        <button
          onClick={() => setActiveTab('INTEGRATIONS')}
          className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'INTEGRATIONS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('set.tab.integrations')}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        
        {/* USERS TAB */}
        {activeTab === 'USERS' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">{t('set.tab.users')}</h2>
              <button 
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + {t('set.user.add')}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">{t('set.user.name')}</th>
                    <th className="px-6 py-3">{t('set.user.user')}</th>
                    <th className="px-6 py-3">{t('set.user.dept')}</th>
                    <th className="px-6 py-3">{t('set.user.role')}</th>
                    <th className="px-6 py-3 text-right">{t('set.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                        <img src={u.avatar} className="w-6 h-6 rounded-full" alt="" />
                        {u.name}
                      </td>
                      <td className="px-6 py-4">{u.username || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-xs border bg-gray-50 border-gray-200 text-gray-700">{u.department}</span>
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'HR_ADMIN' ? (
                          <span className="text-purple-600 font-bold flex items-center gap-1">🛡️ {t('role.admin')}</span>
                        ) : (
                          <span>{t('role.employee')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                             onClick={() => openEditModal(u)}
                             className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            {t('set.user.btnEdit')}
                        </button>
                        {u.id !== currentUser.id && (
                          <button 
                            onClick={() => { if(window.confirm(t('set.user.confirmDelete'))) deleteUser(u.id) }}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            {t('set.user.del')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEPARTMENTS TAB */}
        {activeTab === 'DEPARTMENTS' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">{t('set.tab.dept')}</h2>
              <button 
                onClick={openAddDeptModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + {t('set.dept.add')}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">{t('set.dept.name')}</th>
                    <th className="px-6 py-3 text-right">{t('set.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(dept => (
                    <tr key={dept} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {dept}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                             onClick={() => openEditDeptModal(dept)}
                             className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            {t('set.user.btnEdit')}
                        </button>
                        <button 
                          onClick={() => handleDeleteDept(dept)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          {t('set.user.del')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PERMISSIONS TAB */}
        {activeTab === 'PERMISSIONS' && (
          <div>
             <h2 className="text-lg font-semibold text-gray-800 mb-6">{t('set.perm.access')}</h2>
             <table className="w-full text-sm border-collapse">
               <thead>
                 <tr className="bg-gray-50 border-b border-gray-200">
                   <th className="text-left p-4 font-semibold text-gray-700">Feature</th>
                   <th className="text-center p-4 font-semibold text-gray-700 w-32">{t('role.employee')}</th>
                   <th className="text-center p-4 font-semibold text-gray-700 w-32">{t('role.admin')}</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {permissionFeatures.map((row) => (
                   <tr key={row.key} className="hover:bg-gray-50">
                     <td className="p-4 text-gray-800 font-medium">{row.label}</td>
                     
                     <td className="p-4 text-center">
                         <input 
                            type="checkbox" 
                            checked={permissions.EMPLOYEE[row.key] || false} 
                            onChange={(e) => updatePermission('EMPLOYEE', row.key, e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                         />
                     </td>
                     
                     <td className="p-4 text-center">
                         <input 
                            type="checkbox" 
                            checked={permissions.HR_ADMIN[row.key] || false} 
                            onChange={(e) => updatePermission('HR_ADMIN', row.key, e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                         />
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             <p className="mt-4 text-xs text-gray-500">
               * {t('set.perm.access')} settings are updated immediately.
             </p>
          </div>
        )}

        {/* INTEGRATIONS TAB */}
        {activeTab === 'INTEGRATIONS' && (
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
               <span className="text-green-600 text-2xl">📊</span> {t('set.google.title')}
            </h2>
            <p className="text-gray-500 mb-6">{t('set.google.desc')}</p>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    </div>
                    <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                        {t('set.google.warning')}
                    </p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
               <label className="block text-sm font-medium text-gray-700 mb-2">{t('set.google.url')}</label>
               <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex flex-col gap-1">
                      <input 
                        type="text" 
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className={`border-gray-300 rounded-lg shadow-sm border p-2.5 focus:ring-blue-500 focus:border-blue-500 ${sheetUrl && !isValidUrl ? 'border-red-300 focus:border-red-500 ring-red-200' : ''}`}
                      />
                      {sheetUrl && !isValidUrl && (
                          <span className="text-xs text-red-500">{t('set.google.urlWarning')}</span>
                      )}
                  </div>
                  <div className="flex gap-2 h-11">
                    <button 
                        onClick={handleSheetSave}
                        className="bg-blue-600 text-white px-5 rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap"
                    >
                        {t('set.user.save')}
                    </button>
                    <button 
                        onClick={handleTestConnection}
                        disabled={testingConnection || !sheetUrl}
                        className="bg-gray-200 text-gray-700 px-5 rounded-lg hover:bg-gray-300 font-medium transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                        {testingConnection ? '...' : t('set.google.test')}
                    </button>
                  </div>
               </div>
               
               <div className="mt-3 flex flex-wrap gap-4 items-center">
                    <button
                        onClick={handleAddHeaders}
                        disabled={!sheetUrl}
                        className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:no-underline"
                    >
                        {t('set.google.btnAddHeaders')}
                    </button>
                    {urlSaved && <p className="text-green-600 text-sm font-medium">{t('set.google.saved')}</p>}
                    {testResult === 'SUCCESS' && <p className="text-green-600 text-sm font-medium">{t('set.google.testSuccess')}</p>}
                    {testResult === 'FAIL' && <p className="text-red-600 text-sm font-medium">{t('set.google.testFail')}</p>}
                    {headersAdded && <p className="text-green-600 text-sm font-medium">{t('set.google.headersAdded')}</p>}
               </div>
               
               <div className="mt-6 text-sm text-gray-600 space-y-2">
                 <p className="font-semibold text-gray-800">{t('set.google.setup.title')}</p>
                 <ol className="list-decimal pl-5 space-y-1">
                   <li>{t('set.google.setup.step1')}</li>
                   <li>{t('set.google.setup.step2')}</li>
                   <li>{t('set.google.setup.step3')}</li>
                   <li>{t('set.google.setup.step4')}</li>
                   <li>{t('set.google.setup.step5')}</li>
                   <li>{t('set.google.setup.step6')}</li>
                   <li>{t('set.google.setup.step7')}</li>
                 </ol>
               </div>
            </div>
          </div>
        )}

      </div>

      {/* User Modal (Add/Edit) */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
             <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-white font-bold">{editMode ? t('set.user.edit') : t('set.user.add')}</h3>
                <button onClick={() => setShowUserModal(false)} className="text-white hover:text-blue-200">&times;</button>
             </div>
             <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('set.user.name')}</label>
                  <input required type="text" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData,name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('set.user.user')}</label>
                  <input required type="text" className="w-full border p-2 rounded" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('set.user.pass')}</label>
                  <input required type="text" className="w-full border p-2 rounded" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('set.user.dept')}</label>
                      <select className="w-full border p-2 rounded" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('set.user.role')}</label>
                      <select className="w-full border p-2 rounded" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                        <option value="EMPLOYEE">{t('role.employee')}</option>
                        <option value="HR_ADMIN">{t('role.admin')}</option>
                      </select>
                   </div>
                </div>
                <div className="pt-2 flex justify-end space-x-2">
                  <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">{t('modal.btnCancel')}</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      {editMode ? t('set.user.save') : t('set.user.add')}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
             <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-white font-bold">{editDeptName ? t('set.dept.edit') : t('set.dept.add')}</h3>
                <button onClick={() => setShowDeptModal(false)} className="text-white hover:text-blue-200">&times;</button>
             </div>
             <form onSubmit={handleDeptSubmit} className="p-6 space-y-4">
                {deptError && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{deptError}</div>}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('set.dept.name')}</label>
                  <input required type="text" className="w-full border p-2 rounded" value={deptFormName} onChange={e => setDeptFormName(e.target.value)} />
                </div>
                <div className="pt-2 flex justify-end space-x-2">
                  <button type="button" onClick={() => setShowDeptModal(false)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">{t('modal.btnCancel')}</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      {t('set.user.save')}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
