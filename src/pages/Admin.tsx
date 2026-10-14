import React, { useState, useEffect } from 'react';
import AdminAuth from '../components/AdminAuth';
import AdminDashboard from '../components/AdminDashboard';
import { getAdminSession, logoutAdmin, AdminSession } from '../lib/adminAuth';

interface AdminPageProps {
  files: any[];
  isLoading: boolean;
  subjectsBySemester: { [sem: number]: string[] };
  onSubjectsUpdated: (newMap: { [sem: number]: string[] }) => void;
  onRefresh: () => void;
  onPreview: (file: any) => void;
  onDownload: (file: any) => void;
  onDeleteConfirm: (file: any) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function Admin({
  files,
  isLoading,
  subjectsBySemester,
  onSubjectsUpdated,
  onRefresh,
  onPreview,
  onDownload,
  onDeleteConfirm,
  notify
}: AdminPageProps) {
  const [session, setSession] = useState<AdminSession | null>(() => getAdminSession());

  useEffect(() => {
    // Keep session state updated with localStorage
    const current = getAdminSession();
    setSession(current);
  }, []);

  const handleLoginSuccess = (newSession: AdminSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    logoutAdmin();
    setSession(null);
    notify('Administrator signed out successfully.', 'info');
  };

  if (!session) {
    return <AdminAuth onLoginSuccess={handleLoginSuccess} notify={notify} />;
  }

  return (
    <AdminDashboard
      session={session}
      files={files}
      isLoading={isLoading}
      subjectsBySemester={subjectsBySemester}
      onSubjectsUpdated={onSubjectsUpdated}
      onRefresh={onRefresh}
      onPreview={onPreview}
      onDownload={onDownload}
      onDeleteConfirm={onDeleteConfirm}
      notify={notify}
      onLogout={handleLogout}
    />
  );
}
