
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'TH' | 'EN';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Login
  'login.title': { EN: 'Sign In', TH: 'เข้าสู่ระบบ' },
  'login.subtitle': { EN: 'ZenHR Excellence Center', TH: 'ศูนย์บริหารจัดการบุคลากร ZenHR' },
  'login.username': { EN: 'Username', TH: 'ชื่อผู้ใช้งาน' },
  'login.password': { EN: 'Password', TH: 'รหัสผ่าน' },
  'login.btn': { EN: 'Login', TH: 'เข้าสู่ระบบ' },
  'login.fail': { EN: 'Identity verification failed', TH: 'ไม่สามารถยืนยันตัวตนได้ กรุณาตรวจสอบข้อมูล' },
  'login.logout': { EN: 'Sign Out', TH: 'ออกจากระบบ' },

  // Sidebar
  'menu.dashboard': { EN: 'Executive Dashboard', TH: 'ภาพรวมบริหาร' },
  'menu.calendar': { EN: 'Operations Calendar', TH: 'ปฏิทินปฏิบัติงาน' },
  'menu.myleave': { EN: 'My Requests', TH: 'รายการลาของฉัน' },
  'menu.approvals': { EN: 'Action Center', TH: 'พิจารณาอนุมัติ' },
  'menu.reports': { EN: 'Analytics Reports', TH: 'รายงานวิเคราะห์' },
  'menu.settings': { EN: 'System Settings', TH: 'ตั้งค่าระบบ' },
  'role.employee': { EN: 'Team Member', TH: 'พนักงาน' },
  'role.admin': { EN: 'People Operations', TH: 'ผู้ดูแลระบบ HR' },

  // Dashboard
  'dash.title': { EN: 'Workforce Insight', TH: 'สรุปภาพรวมบุคลากร' },
  'dash.adminView': { EN: 'Management Overview', TH: 'มุมมองสำหรับผู้บริหาร' },
  'dash.filter.from': { EN: 'Period From', TH: 'เริ่มต้น' },
  'dash.filter.to': { EN: 'Until', TH: 'สิ้นสุด' },
  'dash.onLeave': { EN: 'Out of Office Today', TH: 'ลาหยุดวันนี้' },
  'dash.onLeaveList': { EN: 'Active Leave Notifications', TH: 'รายชื่อผู้ที่ลาหยุดวันนี้' },
  'dash.noOnLeave': { EN: 'All staff are present today.', TH: 'วันนี้ไม่มีบุคลากรแจ้งลาหยุด' },
  'dash.pending': { EN: 'Awaiting Action', TH: 'คำขอรอพิจารณา' },
  'dash.approved': { EN: 'Approved Requests', TH: 'อนุมัติแล้ว (ช่วงที่เลือก)' },
  'dash.sick': { EN: 'Medical Incidents', TH: 'ลาป่วยสะสม' },
  'dash.trends': { EN: 'Leave Analytics', TH: 'การวิเคราะห์แนวโน้มการลา' },
  'dash.byType': { EN: 'Distribution by Type', TH: 'สัดส่วนตามประเภทการลา' },
  'dash.byDept': { EN: 'Activity by Department', TH: 'สถิติตามแผนก' },
  'dash.recent': { EN: 'Recent Notifications', TH: 'กิจกรรมล่าสุด' },
  'dash.noActivity': { EN: 'No recent leave records.', TH: 'ไม่มีกิจกรรมการลาล่าสุด' },
  'dash.ai.title': { EN: 'Gemini Strategy AI', TH: 'Gemini วิเคราะห์กลยุทธ์' },
  'dash.ai.subtitle': { EN: 'AI-Driven Workforce Intelligence', TH: 'วิเคราะห์ข้อมูลด้วยปัญญาประดิษฐ์' },
  'dash.ai.placeholder': { EN: 'Generate deep insights to detect workforce risks and trends.', TH: 'คลิกเพื่อวิเคราะห์ความเสี่ยงและแนวโน้มของบุคลากร' },
  'dash.ai.button': { EN: 'Synthesize Insights', TH: 'เริ่มการวิเคราะห์' },
  'dash.ai.analyzing': { EN: 'Synthesizing...', TH: 'กำลังประมวลผล...' },

  // Modal
  'modal.title': { EN: 'Submit Leave Request', TH: 'แจ้งความประสงค์การลา' },
  'type.Annual Leave': { EN: 'Annual Leave', TH: 'ลาพักร้อน' },
  'type.Sick Leave': { EN: 'Sick Leave', TH: 'ลาป่วย' },
  'type.Personal Leave': { EN: 'Personal Leave', TH: 'ลากิจ' },
  'type.Public Holiday': { EN: 'Statutory Holiday', TH: 'วันหยุดนักขัตฤกษ์' },
  
  'status.Pending': { EN: 'Processing', TH: 'รอพิจารณา' },
  'status.Approved': { EN: 'Authorized', TH: 'อนุมัติแล้ว' },
  'status.Rejected': { EN: 'Declined', TH: 'ไม่อนุมัติ' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('TH');

  const t = (key: string, params?: Record<string, string | number>) => {
    let text = translations[key]?.[language] || key;
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, String(params[param]));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
