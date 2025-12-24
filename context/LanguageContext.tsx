
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
  'modal.type': { EN: 'Leave Type', TH: 'ประเภทการลา' },
  'modal.startDate': { EN: 'Start Date', TH: 'วันที่เริ่มต้น' },
  'modal.endDate': { EN: 'End Date', TH: 'วันที่สิ้นสุด' },
  'modal.reason': { EN: 'Reason', TH: 'เหตุผล' },
  'modal.placeholder': { EN: 'Please provide a reason for your leave request...', TH: 'กรุณาระบุเหตุผลในการลา...' },
  'modal.noteDate': { EN: 'Date', TH: 'วันที่' },
  'modal.noteMessage': { EN: 'Note Message (will appear on calendar)', TH: 'ข้อความโน้ต (จะปรากฏบนปฏิทิน)' },
  'modal.notePlaceholder': { EN: 'e.g., Late today by 5 minutes, Work from Home...', TH: 'เช่น วันนี้เข้าสาย 5 นาที, Work from Home...' },
  'modal.noteHint': { EN: 'This note will be displayed on the team calendar', TH: 'โน้ตนี้จะแสดงในปฏิทินทีม' },
  'modal.balance': { EN: 'Balance', TH: 'ยอดคงเหลือ' },
  'modal.remaining': { EN: 'remaining', TH: 'วันคงเหลือ' },
  'modal.duration': { EN: 'Duration', TH: 'ระยะเวลา' },
  'modal.day': { EN: 'day', TH: 'วัน' },
  'modal.days': { EN: 'days', TH: 'วัน' },
  'modal.btnSubmit': { EN: 'Submit Request', TH: 'ส่งคำขอ' },
  'modal.btnSubmitting': { EN: 'Submitting...', TH: 'กำลังส่ง...' },
  'modal.err.dates': { EN: 'Please select both start and end dates', TH: 'กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด' },
  'modal.err.endBeforeStart': { EN: 'End date must be after start date', TH: 'วันที่สิ้นสุดต้องอยู่หลังวันที่เริ่มต้น' },
  'err.annualLimit': { EN: 'Annual leave limit exceeded. You have {days} days remaining.', TH: 'เกินโควต้าลาพักร้อน คุณเหลือ {days} วัน' },
  'err.publicLimit': { EN: 'Public holiday limit exceeded. You have {days} days remaining.', TH: 'เกินโควต้าวันหยุดนักขัตฤกษ์ คุณเหลือ {days} วัน' },
  'err.notLoggedIn': { EN: 'Please log in to submit a leave request', TH: 'กรุณาเข้าสู่ระบบเพื่อส่งคำขอลา' },
  'type.Annual Leave': { EN: 'Annual Leave', TH: 'ลาพักร้อน' },
  'type.Sick Leave': { EN: 'Sick Leave', TH: 'ลาป่วย' },
  'type.Personal Leave': { EN: 'Personal Leave', TH: 'ลากิจ' },
  'type.Public Holiday': { EN: 'Statutory Holiday', TH: 'วันหยุดนักขัตฤกษ์' },
  'type.Note / Activity Notification': { EN: 'Note / Activity Notification', TH: 'โน้ต / แจ้งกิจกรรม' },

  'status.Pending': { EN: 'Processing', TH: 'รอพิจารณา' },
  'status.Approved': { EN: 'Authorized', TH: 'อนุมัติแล้ว' },
  'status.Rejected': { EN: 'Declined', TH: 'ไม่อนุมัติ' },

  // App
  'app.accessDenied': { EN: 'Access Denied', TH: 'ไม่มีสิทธิ์เข้าถึง' },

  // Modal
  'modal.btnCancel': { EN: 'Cancel', TH: 'ยกเลิก' },

  // Settings
  'set.title': { EN: 'System Settings', TH: 'ตั้งค่าระบบ' },
  'set.tab.users': { EN: 'Users', TH: 'ผู้ใช้งาน' },
  'set.tab.dept': { EN: 'Departments', TH: 'แผนก' },
  'set.tab.perm': { EN: 'Permissions', TH: 'สิทธิ์การเข้าถึง' },
  'set.tab.integrations': { EN: 'Integrations', TH: 'การเชื่อมต่อ' },
  'set.tab.policy': { EN: 'Leave Policy', TH: 'โควต้าวันลา' },

  // Settings - Users
  'set.user.add': { EN: 'Add User', TH: 'เพิ่มผู้ใช้' },
  'set.user.edit': { EN: 'Edit User', TH: 'แก้ไขผู้ใช้' },
  'set.user.name': { EN: 'Name', TH: 'ชื่อ' },
  'set.user.user': { EN: 'Username', TH: 'ชื่อผู้ใช้' },
  'set.user.dept': { EN: 'Department', TH: 'แผนก' },
  'set.user.role': { EN: 'Role', TH: 'บทบาท' },
  'set.user.pass': { EN: 'Password', TH: 'รหัสผ่าน' },
  'set.user.btnEdit': { EN: 'Edit', TH: 'แก้ไข' },
  'set.user.del': { EN: 'Delete', TH: 'ลบ' },
  'set.user.save': { EN: 'Save', TH: 'บันทึก' },
  'set.action': { EN: 'Action', TH: 'การดำเนินการ' },
  'set.user.confirmDelete': { EN: 'Delete user?', TH: 'ต้องการลบผู้ใช้นี้หรือไม่?' },
  'set.dept.confirmDelete': { EN: 'Delete department "{name}"?', TH: 'ต้องการลบแผนก "{name}" หรือไม่?' },

  // Settings - Departments
  'set.dept.add': { EN: 'Add Department', TH: 'เพิ่มแผนก' },
  'set.dept.edit': { EN: 'Edit Department', TH: 'แก้ไขแผนก' },
  'set.dept.name': { EN: 'Department Name', TH: 'ชื่อแผนก' },

  // Settings - Permissions
  'set.perm.view': { EN: 'View Dashboard', TH: 'ดูภาพรวม' },
  'set.perm.cal': { EN: 'View Calendar', TH: 'ดูปฏิทิน' },
  'set.perm.req': { EN: 'Request Leave', TH: 'ขอลา' },
  'set.perm.app': { EN: 'Approve Leave', TH: 'อนุมัติการลา' },
  'set.perm.rep': { EN: 'View Reports', TH: 'ดูรายงาน' },
  'set.perm.set': { EN: 'Manage Settings', TH: 'จัดการตั้งค่า' },
  'set.perm.access': { EN: 'Access Permissions', TH: 'สิทธิ์การเข้าถึง' },

  // Settings - Google Sheets Integration
  'set.google.title': { EN: 'Google Sheets Integration', TH: 'เชื่อมต่อกับ Google Sheets' },
  'set.google.desc': { EN: 'Sync leave data to Google Sheets for analysis and reporting.', TH: 'เชื่อมต่อข้อมูลการลากับ Google Sheets เพื่อการวิเคราะห์และรายงาน' },
  'set.google.warning': { EN: '⚠️ Important: Make sure your Google Sheet is publicly accessible (or shared with the service account) for this integration to work.', TH: '⚠️ สำคัญ: ตรวจสอบให้แน่ใจว่า Google Sheet ของคุณสามารถเข้าถึงได้แบบสาธารณะ (หรือแชร์กับ service account) เพื่อให้การเชื่อมต่อทำงานได้' },
  'set.google.url': { EN: 'Google Sheets URL', TH: 'URL ของ Google Sheets' },
  'set.google.urlWarning': { EN: 'Paste the full URL of your Google Sheet here (e.g., https://docs.google.com/spreadsheets/d/...)', TH: 'วาง URL เต็มของ Google Sheet ของคุณที่นี่ (เช่น https://docs.google.com/spreadsheets/d/...)' },
  'set.google.test': { EN: 'Test Connection', TH: 'ทดสอบการเชื่อมต่อ' },
  'set.google.btnAddHeaders': { EN: 'Add Headers to Sheet', TH: 'เพิ่มหัวตารางลงใน Sheet' },
  'set.google.saved': { EN: 'URL saved successfully!', TH: 'บันทึก URL เรียบร้อยแล้ว!' },
  'set.google.testSuccess': { EN: 'Connection successful!', TH: 'เชื่อมต่อสำเร็จ!' },
  'set.google.testFail': { EN: 'Connection failed. Please check the URL and sheet permissions.', TH: 'เชื่อมต่อล้มเหลว กรุณาตรวจสอบ URL และสิทธิ์การเข้าถึง Sheet' },
  'set.google.headersAdded': { EN: 'Headers added successfully!', TH: 'เพิ่มหัวตารางสำเร็จ!' },
  'set.google.setup.title': { EN: 'Setup Instructions:', TH: 'วิธีตั้งค่า:' },
  'set.google.setup.step1': { EN: 'Create a new Google Sheet or use an existing one', TH: 'สร้าง Google Sheet ใหม่หรือใช้ที่มีอยู่' },
  'set.google.setup.step2': { EN: 'Copy the full URL from your browser', TH: 'คัดลอก URL เต็มจากเบราว์เซอร์' },
  'set.google.setup.step3': { EN: 'Paste the URL in the field above', TH: 'วาง URL ในช่องด้านบน' },
  'set.google.setup.step4': { EN: 'Make sure the sheet is publicly accessible (File > Share > Anyone with the link)', TH: 'ตรวจสอบให้แน่ใจว่า Sheet สามารถเข้าถึงได้แบบสาธารณะ (ไฟล์ > แชร์ > ทุกคนที่มีลิงก์)' },
  'set.google.setup.step5': { EN: 'Click "Save" to save the URL', TH: 'คลิก "บันทึก" เพื่อบันทึก URL' },
  'set.google.setup.step6': { EN: 'Click "Test Connection" to verify it works', TH: 'คลิก "ทดสอบการเชื่อมต่อ" เพื่อตรวจสอบว่าใช้งานได้' },
  'set.google.setup.step7': { EN: 'Click "Add Headers to Sheet" to create the column headers', TH: 'คลิก "เพิ่มหัวตารางลงใน Sheet" เพื่อสร้างหัวคอลัมน์' },

  // Reports
  'rep.title': { EN: 'Analytics Reports', TH: 'รายงานวิเคราะห์' },
  'rep.subtitle': { EN: 'Comprehensive leave data analysis and insights', TH: 'วิเคราะห์ข้อมูลการลาอย่างครอบคลุม' },
  'rep.btn.download': { EN: 'Download CSV', TH: 'ดาวน์โหลด CSV' },
  'rep.tab.general': { EN: 'General Report', TH: 'รายงานทั่วไป' },
  'rep.tab.individual': { EN: 'Individual Report', TH: 'รายงานรายบุคคล' },
  'rep.filter.year': { EN: 'Year', TH: 'ปี' },
  'rep.filter.month': { EN: 'Month', TH: 'เดือน' },
  'rep.filter.dept': { EN: 'Department', TH: 'แผนก' },
  'rep.filter.type': { EN: 'Leave Type', TH: 'ประเภทการลา' },
  'rep.filter.all': { EN: 'All', TH: 'ทั้งหมด' },
  'rep.table.date': { EN: 'Date', TH: 'วันที่' },
  'rep.table.name': { EN: 'Name', TH: 'ชื่อ' },
  'rep.table.dept': { EN: 'Department', TH: 'แผนก' },
  'rep.table.type': { EN: 'Type', TH: 'ประเภท' },
  'rep.table.period': { EN: 'Period', TH: 'ช่วงเวลา' },
  'rep.table.days': { EN: 'Days', TH: 'จำนวนวัน' },
  'rep.table.reason': { EN: 'Reason', TH: 'เหตุผล' },
  'rep.table.status': { EN: 'Status', TH: 'สถานะ' },
  'rep.noData': { EN: 'No data found', TH: 'ไม่พบข้อมูล' },
  'rep.records': { EN: 'records', TH: 'รายการ' },
  'rep.ind.selectUser': { EN: 'Select Employee', TH: 'เลือกพนักงาน' },
  'rep.ind.selectPlaceholder': { EN: 'Select an employee to view their report', TH: 'เลือกพนักงานเพื่อดูรายงาน' },
  'rep.ind.stats': { EN: 'Leave Statistics', TH: 'สถิติการลา' },
  'rep.ind.remaining': { EN: 'Remaining', TH: 'คงเหลือ' },
  'rep.ind.used': { EN: 'Used', TH: 'ใช้ไป' },
  'rep.ind.limit': { EN: 'Limit', TH: 'จำกัด' },
  'rep.ind.days': { EN: 'days', TH: 'วัน' },
  'rep.ind.history': { EN: 'Leave History', TH: 'ประวัติการลา' },

  // Calendar
  'cal.title': { EN: 'Operations Calendar', TH: 'ปฏิทินปฏิบัติงาน' },
  'cal.allDepts': { EN: 'All Departments', TH: 'ทุกแผนก' },
  'cal.away': { EN: 'away', TH: 'คนลาหยุด' },

  // My Leaves
  'my.title': { EN: 'My Leave Requests', TH: 'รายการลาของฉัน' },
  'my.subtitle': { EN: 'Manage and track your leave requests', TH: 'จัดการและติดตามคำขอลาของคุณ' },
  'my.btnRequest': { EN: 'Request Leave', TH: 'ขอลา' },
  'my.card.annual': { EN: 'Annual Leave', TH: 'ลาพักร้อน' },
  'my.card.public': { EN: 'Public Holiday', TH: 'วันหยุดนักขัตฤกษ์' },
  'my.card.personal': { EN: 'Personal Leave', TH: 'ลากิจ' },
  'my.card.sick': { EN: 'Sick Leave', TH: 'ลาป่วย' },
  'my.unit.daysLeft': { EN: 'days left', TH: 'วันคงเหลือ' },
  'my.unit.days': { EN: 'days', TH: 'วัน' },
  'my.unit.daysYear': { EN: 'days/year', TH: 'วัน/ปี' },
  'my.stat.thisMonth': { EN: 'This Month', TH: 'เดือนนี้' },
  'my.stat.thisYear': { EN: 'This Year', TH: 'ปีนี้' },
  'my.stat.used': { EN: 'Used', TH: 'ใช้ไป' },
  'my.history': { EN: 'Request History', TH: 'ประวัติการลา' },
  'my.table.type': { EN: 'Type', TH: 'ประเภท' },
  'my.table.dates': { EN: 'Dates', TH: 'วันที่' },
  'my.table.duration': { EN: 'Duration', TH: 'ระยะเวลา' },
  'my.table.reason': { EN: 'Reason', TH: 'เหตุผล' },
  'my.table.status': { EN: 'Status', TH: 'สถานะ' },
  'my.empty': { EN: 'No leave requests yet', TH: 'ยังไม่มีคำขอลา' },
  'my.unlimited': { EN: 'Unlimited quota', TH: 'ไม่จำกัดจำนวน' },
  'my.sortTitle': { EN: 'Click to sort', TH: 'คลิกเพื่อเรียงลำดับ' },

  // Approvals
  'app.title': { EN: 'Action Center', TH: 'พิจารณาอนุมัติ' },
  'app.caughtUp': { EN: 'All caught up!', TH: 'เรียบร้อยแล้ว!' },
  'app.noPending': { EN: 'No pending leave requests', TH: 'ไม่มีคำขอการลาที่รอพิจารณา' },
  'app.btnApprove': { EN: 'Approve', TH: 'อนุมัติ' },
  'app.btnReject': { EN: 'Reject', TH: 'ไม่อนุมัติ' },

  // Common
  'common.to': { EN: 'to', TH: 'ถึง' },
  'common.found': { EN: 'Found:', TH: 'พบ:' },
  'common.noDataFound': { EN: 'No data found.', TH: 'ไม่พบข้อมูล' },

  // Leave policy
  'policy.title': { EN: 'Company Leave Quotas', TH: 'โควต้าวันลามาตรฐานของบริษัท' },
  'policy.subtitle': { EN: 'Set default annual quotas used for validation and dashboards.', TH: 'กำหนดโควต้าวันลาพื้นฐานที่ใช้ตรวจสอบสิทธิ์และคำนวณรายงาน' },
  'policy.annual': { EN: 'Annual leave per year (days)', TH: 'ลาพักร้อนต่อปี (วัน)' },
  'policy.publicHoliday': { EN: 'Public holiday per year (days)', TH: 'วันหยุดนักขัตฤกษ์ต่อปี (วัน)' },
  'policy.note': { EN: 'These values are used as default quotas for all employees when requesting leave and in analytics.', TH: 'ค่าดังกล่าวจะถูกใช้เป็นโควต้าพื้นฐานสำหรับพนักงานทุกคนในการขอลาและการคำนวณรายงาน' },
  'policy.save': { EN: 'Save leave quotas', TH: 'บันทึกโควต้าวันลา' },

  // Profile
  'profile.title': { EN: 'My Profile', TH: 'โปรไฟล์ของฉัน' },
  'profile.subtitle': { EN: 'Update your name and login information.', TH: 'แก้ไขชื่อและข้อมูลเข้าสู่ระบบของคุณ' },
  'profile.name': { EN: 'Full name', TH: 'ชื่อ - นามสกุล' },
  'profile.username': { EN: 'Username', TH: 'ชื่อผู้ใช้' },
  'profile.password': { EN: 'Password', TH: 'รหัสผ่าน' },
  'profile.passwordNote': { EN: 'For demo purposes the password is stored in plain text. Do not reuse real passwords.', TH: 'เพื่อการทดสอบเท่านั้น รหัสผ่านจะถูกเก็บแบบไม่เข้ารหัส กรุณาอย่าใช้รหัสผ่านจริงที่ใช้กับระบบอื่น' },
  'profile.save': { EN: 'Save changes', TH: 'บันทึกการเปลี่ยนแปลง' },
  'profile.saving': { EN: 'Saving...', TH: 'กำลังบันทึก...' },
  'profile.saved': { EN: 'Your profile has been updated.', TH: 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว' },
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
