
import React, { useState, useEffect } from 'react';
import { ScanLine, ClipboardCheck, History, LogOut, Loader2, CheckCircle2, ChevronRight, Building2, AlertTriangle, Settings, User as UserIcon, Lock, ArrowRight, X, KeyRound, Clock, Search, UploadCloud, Trash2, Camera, FileText, Barcode, Moon, Sun, Palette, PieChart, BarChart, Download, CheckSquare, Share2, Copy } from 'lucide-react';
import { QRScanner } from './components/QRScanner';
import { ChecklistItem } from './components/ChecklistItem';
import { Equipment, ChecklistItemData, InspectionStatus, InspectionForm, User, Activity } from './types';
import { USERS } from './data/User';
import { EQUIPMENT_LIST } from './data/Asset';
import { ASSET_SCHEDULES } from './data/AssetScheduling';
import { generateChecklistForEquipment, analyzeInspectionReport } from './services/geminiService';

enum AppView {
  LOGIN = 'LOGIN',
  HOME = 'HOME',
  SCANNER = 'SCANNER',
  ACTIVITY_SELECT = 'ACTIVITY_SELECT',
  FORM = 'FORM',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
  ASSET_SEARCH = 'ASSET_SEARCH',
  HISTORY = 'HISTORY',
}

// اگر لینک عکس دارید اینجا بگذارید، وگرنه سیستم از لوگوی طراحی شده استفاده میکند
const LOGO_URL: string = ""; 

const CompanyLogo = ({ name, className, bgColor }: { name: string, className?: string, bgColor?: string }) => {
  // اگر کاربر لینک عکس گذاشته بود آن را نشان بده
  if (LOGO_URL && LOGO_URL.length > 10) {
      return (
        <div className={`relative overflow-hidden flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 ${className}`} style={{ backgroundColor: bgColor || '#ffffff' }}>
          <img src={LOGO_URL} alt={name} className="h-full object-contain p-2 w-full" />
        </div>
      );
  }

  // در غیر این صورت، این لوگوی طراحی شده (SVG) را نشان بده
  return (
    <div className={`relative overflow-hidden flex flex-col items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 dark:bg-slate-800 ${className}`} style={{ backgroundColor: bgColor || '#ffffff' }}>
      <svg viewBox="0 0 200 200" className="w-full h-full p-3" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#991b1b', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:'#7f1d1d', stopOpacity:1}} />
          </linearGradient>
        </defs>
        
        {/* Abstract Mountain/Mine Shape */}
        <path d="M100 20 L180 170 H20 L100 20 Z" fill="url(#grad1)" opacity="0.1" />
        
        {/* Layer 1 (Bottom) - Dark Red */}
        <path d="M40 160 L100 130 L160 160 L100 190 Z" fill="#7f1d1d" />
        
        {/* Layer 2 (Middle) - Slate Grey (Industrial) */}
        <path d="M50 120 L100 90 L150 120 L100 150 Z" fill="#64748b" />
        
        {/* Layer 3 (Top) - Bright Red */}
        <path d="M60 80 L100 50 L140 80 L100 110 Z" fill="#991b1b" />
        
        {/* Shine effect */}
        <path d="M100 50 L120 65 L100 80 L80 65 Z" fill="#ffffff" opacity="0.2" />
      </svg>
      {/* Optional Text inside logo component if needed, usually hidden for icon-only usage */}
    </div>
  );
};

// --- Analytics Component ---
const AnalyticsDashboard = ({ history }: { history: InspectionForm[] }) => {
    // Calc stats
    const totalItems = history.reduce((acc, curr) => acc + curr.items.length, 0);
    const failItems = history.reduce((acc, curr) => acc + curr.items.filter(i => i.status === InspectionStatus.FAIL).length, 0);
    const passItems = history.reduce((acc, curr) => acc + curr.items.filter(i => i.status === InspectionStatus.PASS).length, 0);
    
    // Pie Chart Logic (CSS conic-gradient is easier than SVG for simple pie)
    const failPercent = totalItems ? (failItems / totalItems) * 100 : 0;
    const passPercent = totalItems ? (passItems / totalItems) * 100 : 0;
    
    // Bar Chart Data (Last 5 days)
    const last5Days = Array.from({length: 5}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('fa-IR'); // simple key
    }).reverse();
    
    const activityPerDay = last5Days.map(date => {
        return history.filter(h => new Date(h.timestamp).toLocaleDateString('fa-IR') === date).length;
    });
    
    const maxActivity = Math.max(...activityPerDay, 5); // scale

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Health Stats Pie Chart */}
            <div className="bg-white dark:bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg text-purple-600 dark:text-purple-400"><PieChart size={18}/></div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">وضعیت تجهیزات</h3>
                </div>
                <div className="flex items-center justify-around">
                     <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 shadow-inner" 
                          style={{
                              background: totalItems > 0 
                                ? `conic-gradient(#ef4444 ${failPercent}%, #10b981 ${failPercent}% ${failPercent + passPercent}%, #e2e8f0 ${failPercent + passPercent}% 100%)`
                                : '#e2e8f0'
                          }}>
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 shadow-sm">
                            {totalItems > 0 ? `${totalItems} آیتم` : 'خالی'}
                        </div>
                     </div>
                     <div className="flex flex-col gap-2 text-xs">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></span><span className="text-slate-600 dark:text-slate-300">سالم: {passItems}</span></div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 shadow-sm"></span><span className="text-slate-600 dark:text-slate-300">خراب: {failItems}</span></div>
                     </div>
                </div>
            </div>

            {/* Activity Bar Chart */}
            <div className="bg-white dark:bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg text-orange-600 dark:text-orange-400"><BarChart size={18}/></div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">فعالیت اخیر</h3>
                </div>
                <div className="flex items-end justify-between h-24 px-2 gap-2">
                    {activityPerDay.map((count, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1 flex-1 group">
                            <div className="relative w-full flex items-end h-full">
                                <div 
                                    className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-t-md transition-all group-hover:bg-accent relative"
                                    style={{ height: `${(count / maxActivity) * 100}%`, minHeight: '4px' }}
                                >
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{count}</div>
                                </div>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">{last5Days[idx].split('/')[2]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [inspectionHistory, setInspectionHistory] = useState<InspectionForm[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  // Default theme set to 'light'
  const [theme, setTheme] = useState<string>(localStorage.getItem('app_theme') || 'light');

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Settings State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // History Selection State
  const [selectedHistoryIndices, setSelectedHistoryIndices] = useState<number[]>([]);

  // Inspection State
  const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(null);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemData[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [submissionDate, setSubmissionDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedHistory = localStorage.getItem('inspection_history');
    if (savedHistory) {
      try {
        setInspectionHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      const savedAvatar = localStorage.getItem(`user_avatar_${user.code}`);
      setUserAvatar(savedAvatar);
    } else {
      setUserAvatar(null);
    }
  }, [user]);

  // Theme Effect
  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Reset selection when leaving history view
  useEffect(() => {
      if (view !== AppView.HISTORY) {
          setSelectedHistoryIndices([]);
      }
  }, [view]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUserAvatar(base64String);
        localStorage.setItem(`user_avatar_${user.code}`, base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarReset = () => {
    if (user) {
      localStorage.removeItem(`user_avatar_${user.code}`);
      setUserAvatar(null);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const foundUser = USERS.find(u => u.code === username);
    if (foundUser) {
      const storedPassword = localStorage.getItem(`user_pwd_${foundUser.code}`);
      const validPassword = storedPassword || foundUser.code;
      if (password === validPassword) {
        setUser(foundUser);
        setView(AppView.HOME);
      } else {
        setLoginError('نام کاربری یا رمز عبور اشتباه است.');
      }
    } else {
      setLoginError('نام کاربری یا رمز عبور اشتباه است.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
    setShowSettings(false);
    setCurrentEquipment(null);
    setChecklistItems([]);
    setAnalysisResult("");
    setView(AppView.LOGIN);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPasswordMessage(null);
    const storedPassword = localStorage.getItem(`user_pwd_${user.code}`);
    const currentValidPassword = storedPassword || user.code;

    if (oldPassword !== currentValidPassword) {
      setPasswordMessage({ type: 'error', text: 'رمز عبور فعلی اشتباه است.' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMessage({ type: 'error', text: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'تکرار رمز عبور مطابقت ندارد.' });
      return;
    }

    localStorage.setItem(`user_pwd_${user.code}`, newPassword);
    setPasswordMessage({ type: 'success', text: 'رمز عبور با موفقیت تغییر کرد.' });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setPasswordMessage(null);
      setShowSettings(false);
    }, 1500);
  };

  const toggleHistorySelection = (index: number) => {
      setSelectedHistoryIndices(prev => 
          prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
  };

  const selectAllHistory = () => {
      if (selectedHistoryIndices.length === inspectionHistory.length) {
          setSelectedHistoryIndices([]);
      } else {
          setSelectedHistoryIndices(inspectionHistory.map((_, i) => i));
      }
  };

  const handleExportCSV = () => {
    const targetHistory = selectedHistoryIndices.length > 0 
        ? inspectionHistory.filter((_, idx) => selectedHistoryIndices.includes(idx))
        : inspectionHistory;

    if (targetHistory.length === 0) return;

    const headers = ['Date', 'Equipment Name', 'Equipment Code', 'Inspector', 'Activity', 'Task', 'Status', 'Comment'];
    const csvContent = [
        headers.join(','),
        ...targetHistory.flatMap(report => 
        report.items.map(item => [
            new Date(report.timestamp).toLocaleDateString('fa-IR'),
            `"${report.equipmentName}"`,
            report.equipmentId, 
            report.inspectorName,
            `"${report.activityName || ''}"`,
            `"${item.task}"`,
            item.status,
            `"${item.comment || ''}"`
        ].join(','))
        )
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Inspection_Report_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const handleScan = async (code: string) => {
    const equipmentEntry = EQUIPMENT_LIST.find(e => e.code === code);
    let equipmentName = code;
    let equipmentDescription = 'واحد کنسانتره اسدآباد';

    if (equipmentEntry) {
      equipmentName = equipmentEntry.name;
      if (equipmentEntry.traditionalName) {
        equipmentDescription = equipmentEntry.traditionalName;
      }
    }

    const equipmentData: Equipment = {
      id: code,
      name: equipmentName,
      description: equipmentDescription,
      lastMaintained: '1402/07/15',
    };
    
    setCurrentEquipment(equipmentData);

    const scheduledActivities: Activity[] = ASSET_SCHEDULES
      .filter(schedule => schedule.assetNumber === code)
      .map(schedule => ({
        code: schedule.jobCardCode,
        name: schedule.jobCardName,
        equipmentTag: code,
        planCode: schedule.planCode
      }));

    // Remove duplicates
    const uniqueActivities = Array.from(new Map(scheduledActivities.map(a => [a.code, a])).values());
    
    if (uniqueActivities.length > 0) {
      setAvailableActivities(uniqueActivities);
      setView(AppView.ACTIVITY_SELECT);
    } else {
      setAvailableActivities([]);
      startInspection(equipmentData, undefined);
    }
  };

  const startInspection = async (equipment: Equipment, activity?: Activity) => {
    setSelectedActivity(activity || null);
    setView(AppView.FORM);
    setLoadingChecklist(true);

    const activityName = activity ? activity.name : undefined;
    const activityCode = activity ? activity.code : undefined;
    
    const generatedTasks = await generateChecklistForEquipment(equipment.name, activityName, activityCode);
    
    const initialItems: ChecklistItemData[] = generatedTasks.map((task, index) => ({
      id: `item-${index}`,
      task: task.task,
      description: task.description,
      status: InspectionStatus.PENDING,
      comment: '',
    }));

    setChecklistItems(initialItems);
    setLoadingChecklist(false);
  };

  const handleUpdateItem = (updatedItem: ChecklistItemData) => {
    setChecklistItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const isItemComplete = (item: ChecklistItemData) => {
    if (item.status === InspectionStatus.PENDING) return false;
    if (item.status === InspectionStatus.FAIL && (!item.comment || item.comment.trim() === '')) return false;
    return true;
  };

  const calculateProgress = () => {
    if (checklistItems.length === 0) return 0;
    const completed = checklistItems.filter(isItemComplete).length;
    return Math.round((completed / checklistItems.length) * 100);
  };

  const getIncompleteCount = () => {
    return checklistItems.length - checklistItems.filter(isItemComplete).length;
  }

  const handleSubmit = async () => {
    if (!currentEquipment || !user) return;
    setView(AppView.SUBMITTING);

    const now = new Date();
    const dayName = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(now);
    const datePart = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const timePart = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
    
    const formattedTimestamp = `${dayName}، ${datePart}، ساعت ${timePart}`;
    setSubmissionDate(formattedTimestamp);

    const formData: InspectionForm = {
      equipmentId: currentEquipment.id,
      equipmentName: currentEquipment.name,
      activityName: selectedActivity?.name,
      timestamp: Date.now(),
      inspectorName: user.name,
      inspectorCode: user.code,
      items: checklistItems
    };
    
    const newHistory = [formData, ...inspectionHistory];
    setInspectionHistory(newHistory);
    localStorage.setItem('inspection_history', JSON.stringify(newHistory));

    const analysis = await analyzeInspectionReport(formData);
    setAnalysisResult(analysis);
    setView(AppView.SUCCESS);
  };

  const handleShareReport = async () => {
      if (!currentEquipment || !user) return;
      
      const failedItems = checklistItems.filter(i => i.status === InspectionStatus.FAIL);
      const passedItems = checklistItems.filter(i => i.status === InspectionStatus.PASS);
      
      const shareText = `
📋 *گزارش بازرسی فنی - CMMS صبانور*
      
🛠 تجهیز: ${currentEquipment.name} (${currentEquipment.id})
👤 بازرس: ${user.name}
📅 تاریخ: ${submissionDate}
🔧 فعالیت: ${selectedActivity?.name || 'بازرسی عمومی'}

✅ آیتم‌های سالم: ${passedItems.length}
❌ موارد معیوب: ${failedItems.length}

${failedItems.length > 0 ? '⚠️ *لیست خرابی‌ها:*' : ''}
${failedItems.map(i => `- ${i.task}: ${i.comment}`).join('\n')}

📝 تحلیل هوشمند:
${analysisResult}
      `.trim();

      if (navigator.share) {
          try {
              await navigator.share({
                  title: `گزارش بازرسی ${currentEquipment.name}`,
                  text: shareText,
              });
          } catch (error) {
              console.log('Error sharing:', error);
          }
      } else {
          // Fallback: Copy to clipboard
          navigator.clipboard.writeText(shareText);
          alert('متن گزارش در کلیپ‌بورد کپی شد. می‌توانید آن را در پیام‌رسان‌ها ارسال کنید.');
      }
  };

  const resetApp = () => {
    setView(user ? AppView.HOME : AppView.LOGIN);
    setCurrentEquipment(null);
    setChecklistItems([]);
    setAnalysisResult("");
    setSelectedActivity(null);
    setSearchTerm('');
  };

  const formatHistoryDate = (timestamp: number) => {
      return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
  };

  // --- Render Views ---

  if (view === AppView.LOGIN) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
        
        <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
           <div className="flex justify-center items-center mb-10">
              <CompanyLogo name="صبانور" className="h-44 w-44 rounded-[2.5rem] shadow-2xl shadow-slate-300/50 dark:shadow-red-900/40 p-4 ring-4 ring-white/10" bgColor={theme === 'dark' ? '#1e293b' : '#ffffff'} />
           </div>

           <div className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">ورود به سامانه</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs">جهت ورود کد پرسنلی خود را وارد کنید</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 dark:text-slate-300 pr-2">کد پرسنلی</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><UserIcon size={18} /></div>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl py-3 pr-10 pl-4 outline-none focus:border-red-500 focus:bg-slate-50 dark:focus:bg-slate-800/80 transition-all text-left dir-ltr placeholder:text-right"
                      placeholder="1234"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-500 dark:text-slate-300 pr-2">رمز عبور</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><Lock size={18} /></div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl py-3 pr-10 pl-4 outline-none focus:border-red-500 focus:bg-slate-50 dark:focus:bg-slate-800/80 transition-all text-left dir-ltr placeholder:text-right"
                      placeholder="••••"
                    />
                  </div>
                </div>

                {loginError && <div className="text-red-500 dark:text-red-400 text-xs text-center bg-red-100 dark:bg-red-400/10 py-2 rounded-lg border border-red-200 dark:border-red-400/20">{loginError}</div>}

                <button type="submit" className="w-full bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-900/30 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2">
                  <span>ورود</span>
                  <ArrowRight size={18} className="rtl:rotate-180" />
                </button>
              </form>
           </div>
        </div>
        <div className="absolute bottom-6 text-slate-400 dark:text-slate-500 text-[10px] font-mono flex flex-col items-center gap-1 opacity-70">
           <span>V1.1.2 Lite</span>
           <span className="uppercase tracking-widest">Design By H.Parsa</span>
        </div>
      </div>
    );
  }

  if (view === AppView.SCANNER) {
    return <QRScanner onScan={handleScan} onClose={() => setView(AppView.HOME)} />;
  }

  if (view === AppView.HISTORY) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col transition-colors duration-300">
            <div className="bg-white dark:bg-slate-900 px-6 py-6 shadow-sm border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><History size={24} className="text-slate-600 dark:text-slate-400" />سوابق</h2>
                    <div className="flex gap-2">
                        <button onClick={selectAllHistory} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-accent transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="انتخاب همه">
                             <CheckSquare size={20} className={selectedHistoryIndices.length === inspectionHistory.length && inspectionHistory.length > 0 ? "text-accent fill-accent/10" : ""} />
                        </button>
                        <button onClick={handleExportCSV} className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors flex items-center gap-1.5 px-3">
                            <Download size={18} />
                            <span className="text-xs font-bold">
                                {selectedHistoryIndices.length > 0 ? `دانلود (${selectedHistoryIndices.length})` : 'دانلود همه'}
                            </span>
                        </button>
                        <button onClick={() => setView(AppView.HOME)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors"><X size={20} /></button>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {inspectionHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400"><History size={48} className="mb-4 opacity-50" /><p>هنوز بازرسی ثبت نشده است.</p></div>
                ) : (
                    inspectionHistory.map((report, idx) => (
                        <div key={idx} onClick={() => toggleHistorySelection(idx)} className={`cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all duration-200 ${selectedHistoryIndices.includes(idx) ? 'border-accent ring-1 ring-accent bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800'} shadow-sm flex flex-col gap-3 relative group hover:border-slate-300 dark:hover:border-slate-700`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                     <div className={`w-5 h-5 mt-1 rounded flex items-center justify-center border transition-colors ${selectedHistoryIndices.includes(idx) ? 'bg-accent border-accent text-white' : 'border-slate-300 dark:border-slate-600 bg-transparent'}`}>
                                         {selectedHistoryIndices.includes(idx) && <CheckCircle2 size={14} />}
                                     </div>
                                     <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">{report.equipmentName}</h3>
                                        <span className="text-xs text-slate-500 font-mono mt-1 inline-block">{report.equipmentId}</span>
                                     </div>
                                </div>
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full font-mono">{formatHistoryDate(report.timestamp)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs mr-8"><span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">{report.activityName || "بازرسی عمومی"}</span><span className="text-slate-400">توسط: {report.inspectorName}</span></div>
                            <div className="flex gap-2 mt-1 mr-8">
                                <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center border border-green-100 dark:border-green-900/30"><span className="block text-lg font-bold text-green-600 dark:text-green-400">{report.items.filter(i => i.status === InspectionStatus.PASS).length}</span><span className="text-[10px] text-green-500 dark:text-green-400/70">سالم</span></div>
                                <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center border border-red-100 dark:border-red-900/30"><span className="block text-lg font-bold text-red-600 dark:text-red-400">{report.items.filter(i => i.status === InspectionStatus.FAIL).length}</span><span className="text-[10px] text-red-500 dark:text-red-400/70">خراب</span></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      )
  }
  
  if (view === AppView.ASSET_SEARCH) {
     const filteredAssets = EQUIPMENT_LIST.filter(asset => 
        asset.name.includes(searchTerm) || asset.code.toLowerCase().includes(searchTerm.toLowerCase()) || (asset.traditionalName && asset.traditionalName.includes(searchTerm))
     );
     return (
       <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col transition-colors duration-300">
         <div className="bg-white dark:bg-slate-900 px-6 py-6 shadow-sm border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><Search size={24} className="text-red-600" />جستجو</h2>
               <button onClick={() => setView(AppView.HOME)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-500"><X size={20} /></button>
            </div>
            <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><Search size={18} /></div>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="نام یا کد تجهیز..." className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 pr-10 pl-4 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/50 transition-all text-sm" autoFocus />
            </div>
         </div>
         <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <div key={asset.code} onClick={() => handleScan(asset.code)} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-red-300 dark:hover:border-red-800 cursor-pointer flex justify-between items-center group">
                     <div className="flex items-center gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg text-slate-400 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 group-hover:text-red-500"><Building2 size={20} /></div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-red-700 dark:group-hover:text-red-400">{asset.name}</h3>
                            {asset.traditionalName && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{asset.traditionalName}</p>}
                            <div className="flex flex-col gap-0.5 mt-1"><span className="text-[10px] font-mono text-slate-400">{asset.code}</span></div>
                        </div>
                     </div>
                     <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-red-500 rtl:rotate-180" />
                  </div>
                ))
            ) : <div className="text-center py-10 text-slate-400"><p>موردی یافت نشد.</p></div>}
         </div>
       </div>
     );
  }

  if (view === AppView.ACTIVITY_SELECT) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 px-6 py-6 shadow-sm border-b border-slate-100 dark:border-slate-800">
           <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-black text-slate-800 dark:text-white">انتخاب فعالیت</h2><button onClick={resetApp} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"><X size={20} /></button></div>
           <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
               <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm"><Building2 className="text-red-600" size={24} /></div>
               <div>
                   <p className="text-red-900 dark:text-red-200 font-bold text-sm">{currentEquipment?.name}</p>
                   <p className="text-red-700 dark:text-red-300 text-xs mt-0.5">{currentEquipment?.description}</p>
                   <p className="text-red-500 dark:text-red-400 text-[10px] mt-0.5 font-mono">{currentEquipment?.id}</p>
               </div>
           </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
           <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">نوع عملیات:</p>
           {availableActivities.map((activity, idx) => (
             <button key={idx} onClick={() => currentEquipment && startInspection(currentEquipment, activity)} className="w-full bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-red-400 dark:hover:border-red-700 transition-all text-right group">
                <div className="flex justify-between items-center">
                   <div className="flex items-start gap-3">
                      <div className={`mt-1 p-2 rounded-lg ${activity.code.includes('INS') ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : activity.code.includes('LUB') ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'}`}>{activity.code.includes('LUB') ? <Settings size={18} /> : <FileText size={18} />}</div>
                      <div className="text-right"><h3 className="font-bold text-slate-800 dark:text-white text-sm mb-1 leading-snug group-hover:text-red-700 dark:group-hover:text-red-400">{activity.name}</h3><div className="flex gap-2"><span className="text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">{activity.code}</span></div></div>
                   </div>
                   <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-red-500 rtl:rotate-180" size={20} />
                </div>
             </button>
           ))}
        </div>
      </div>
    );
  }

  if (view === AppView.SUBMITTING) return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6"><Loader2 className="w-16 h-16 animate-spin text-white mb-4" /><h2 className="text-2xl font-bold">در حال پردازش...</h2></div>;

  if (view === AppView.SUCCESS) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/30"><CheckCircle2 className="w-12 h-12 text-white" /></div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">ثبت موفق</h2>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 w-full mb-8 text-right"><div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800"><div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-accent"><ClipboardCheck size={20} /></div><h3 className="text-sm font-bold text-slate-800 dark:text-white">تحلیل هوشمند</h3></div><p className="text-sm text-slate-600 dark:text-slate-300 leading-7 text-justify">{analysisResult}</p><div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs"><div className="flex items-center gap-1.5 text-slate-400"><Clock size={14} /><span>زمان ثبت:</span></div><span className="font-sans font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">{submissionDate}</span></div></div>
          
          <div className="w-full flex gap-3 mb-4">
              <button onClick={handleShareReport} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Share2 size={18} />
                  <span>ارسال</span>
              </button>
          </div>

          <button onClick={resetApp} className="w-full bg-slate-900 dark:bg-slate-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-lg active:scale-95">بازگشت به داشبورد</button>
        </div>
      </div>
    );
  }

  if (view === AppView.FORM) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] dark:bg-slate-950 pb-32 font-sans transition-colors duration-300">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md pb-4 pt-12 px-5 shadow-sm rounded-b-[2rem] sticky top-0 z-30 border-b border-white/50 dark:border-slate-800/50">
          <div className="flex justify-between items-center mb-4">
             <button onClick={resetApp} className="p-3 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-red-500 transition-colors shadow-sm border border-slate-100 dark:border-slate-700" title="بازگشت"><ArrowRight size={20} className="rtl:rotate-180" /></button>
             <div className="flex items-center gap-2"><CompanyLogo name="صبانور" className="h-14 w-14 rounded-xl" bgColor={theme === 'dark' ? '#1e293b' : '#fef2f2'} /></div>
          </div>
          <div className="flex flex-col items-center text-center mt-2">
             <h2 className="font-black text-xl text-slate-800 dark:text-white leading-tight">{currentEquipment?.name}</h2>
             {selectedActivity && <div className="mt-2 flex flex-col items-center gap-1"><div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-4 py-1.5 rounded-full text-xs font-bold border border-red-100 dark:border-red-900/30 shadow-sm flex items-center gap-1.5"><ClipboardCheck size={14} />{selectedActivity.name}</div></div>}
          </div>
          <div className="mt-6"><div className="flex justify-between mb-2 text-xs font-medium text-slate-400 px-1"><span>پیشرفت</span><span className={calculateProgress() === 100 ? 'text-green-500' : 'text-red-500'}>{calculateProgress()}%</span></div><div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner"><div className={`h-full rounded-full transition-all duration-700 ease-out ${calculateProgress() === 100 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${calculateProgress()}%` }} /></div></div>
        </div>

        <div className="px-5 space-y-4 mt-6">
          {loadingChecklist ? <div className="flex flex-col items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-red-500" /><p className="text-slate-500 text-sm font-medium mt-4">در حال فراخوانی...</p></div> : checklistItems.map((item, idx) => (<ChecklistItem key={item.id} item={item} onChange={handleUpdateItem} />))}
        </div>

        <div className="fixed bottom-6 left-6 right-6 z-20">
          <button disabled={calculateProgress() < 100} onClick={handleSubmit} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 backdrop-blur-md ${calculateProgress() === 100 ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-slate-900/40 hover:bg-black dark:hover:bg-slate-700' : 'bg-white/80 dark:bg-slate-900/80 text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed'}`}>{calculateProgress() === 100 ? <><ClipboardCheck className="w-6 h-6" /><span>ثبت نهایی</span></> : <span className="text-sm font-medium">{getIncompleteCount()} آیتم باقی‌مانده</span>}</button>
        </div>
      </div>
    );
  }

  // Home View
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] relative overflow-hidden flex flex-col font-sans transition-colors duration-300">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
      <div className="flex-1 flex flex-col relative z-10 px-6 pt-16">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-4">
               <div className="relative group">
                   <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-500 rounded-full opacity-75 group-hover:opacity-100 transition duration-200 blur-[2px]"></div>
                   <div className="relative bg-white dark:bg-slate-800 p-0.5 rounded-full h-16 w-16 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-xl">
                        {userAvatar ? (
                            <img src={userAvatar} alt="Profile" className="w-full h-full object-cover object-top rounded-full" />
                        ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center rounded-full">
                                <UserIcon className="text-slate-400 dark:text-slate-400" size={28} />
                            </div>
                        )}
                   </div>
               </div>
               <div>
                   <h2 className="text-slate-800 dark:text-white font-black text-xl tracking-tight">{user?.name}</h2>
                   <p className="text-slate-500 dark:text-slate-400 text-xs font-medium bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md inline-block mt-1">{user?.org}</p>
               </div>
           </div>
           <div className="flex gap-3">
             <button onClick={handleLogout} className="bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 p-3 rounded-2xl transition-all shadow-sm border border-slate-100 dark:border-white/5 hover:border-red-100 dark:hover:border-red-500/30 group"><LogOut size={20} className="rtl:rotate-180 group-hover:scale-110 transition-transform" /></button>
             <button onClick={() => setShowSettings(true)} className="bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 p-3 rounded-2xl transition-all shadow-sm border border-slate-100 dark:border-white/5 hover:border-blue-100 dark:hover:border-blue-500/30 group"><Settings size={20} className="group-hover:rotate-45 transition-transform duration-500" /></button>
           </div>
        </div>

        {/* Dashboard Charts */}
        <AnalyticsDashboard history={inspectionHistory} />

        <div className="flex flex-col items-center justify-center mb-10 flex-1">
           <div className="relative group"><div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full group-hover:bg-red-500/30 transition-all duration-500"></div><CompanyLogo name="صبانور" className="h-40 w-40 rounded-[2.5rem] shadow-2xl shadow-slate-300/50 dark:shadow-red-900/40 p-5 relative z-10" bgColor={theme === 'dark' ? '#ffffff' : '#ffffff'} /></div>
           <div className="text-center mt-8 space-y-2"><h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight drop-shadow-sm"><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 dark:from-red-400 dark:to-orange-400">Sabanour</span> CMMS</h1><p className="text-slate-500 dark:text-slate-400 text-sm font-medium bg-white/50 dark:bg-white/5 px-4 py-1 rounded-full border border-slate-100 dark:border-white/5 inline-block">سامانه هوشمند مدیریت نگهداری و تعمیرات</p></div>
        </div>

        <div className="space-y-3 max-w-md mx-auto w-full mb-10">
            <button onClick={() => setView(AppView.SCANNER)} className="group relative w-full overflow-hidden rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-900/20">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-500 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-5 flex items-center justify-between"><div className="flex flex-col items-start text-white"><span className="font-bold text-lg mb-0.5">شروع بازرسی</span><span className="text-red-100 text-[10px] opacity-80">اسکن QR Code</span></div><div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-inner"><ScanLine size={24} className="text-white" /></div></div>
            </button>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setView(AppView.ASSET_SEARCH)} className="bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold text-xs border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center gap-2 backdrop-blur-md shadow-sm dark:hover:text-white"><Search size={20} className="text-accent" /><span>جستجو</span></button>
                <button onClick={() => setView(AppView.HISTORY)} className="bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold text-xs border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center gap-2 backdrop-blur-md shadow-sm dark:hover:text-white"><History size={20} className="text-green-500 dark:text-green-400" /><span>سوابق</span></button>
            </div>
        </div>
      </div>
      <div className="py-4 text-center border-t border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-black/20 backdrop-blur-lg"><p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-widest uppercase">Design By H.Parsa</p></div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
           <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 relative z-10 overflow-hidden transition-colors duration-300">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700"><h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2"><Settings size={18} className="text-accent" />تنظیمات</h3><button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-red-500 dark:hover:text-white"><X size={20} /></button></div>
              <div className="p-6 space-y-6">
                 {/* Theme Selection */}
                 <div>
                    <h4 className="text-slate-500 dark:text-slate-300 text-sm font-bold mb-4 flex items-center gap-2"><Palette size={16} />ظاهر برنامه</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setTheme('light')} 
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-accent bg-blue-50 text-accent' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Sun size={24} className="mb-2" />
                            <span className="text-xs font-bold">روشن</span>
                        </button>
                        <button 
                            onClick={() => setTheme('dark')} 
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-accent bg-slate-800 text-accent' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Moon size={24} className="mb-2" />
                            <span className="text-xs font-bold">تاریک</span>
                        </button>
                    </div>
                 </div>

                 <div>
                    <h4 className="text-slate-500 dark:text-slate-300 text-sm font-bold mb-4 flex items-center gap-2"><Camera size={16} />عکس پروفایل</h4>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed text-center flex justify-between items-center">
                        <div className="h-12 w-12 rounded-full border-2 border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">{userAvatar ? <img src={userAvatar} alt="Profile" className="w-full h-full object-cover object-top" /> : <UserIcon className="text-slate-400 dark:text-slate-500" size={24} />}</div>
                        <label className="cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-white text-xs py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center gap-2 transition-colors"><UploadCloud size={14} /><span>آپلود</span><input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} /></label>
                        {userAvatar && <button onClick={handleAvatarReset} className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs py-2 px-3 rounded-xl border border-red-100 dark:border-red-500/20 transition-colors"><Trash2 size={14} /></button>}
                    </div>
                 </div>
                 <div>
                    <h4 className="text-slate-500 dark:text-slate-300 text-sm font-bold mb-4 flex items-center gap-2"><KeyRound size={16} />رمز عبور</h4>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                       <input type="password" placeholder="فعلی" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-accent transition-colors" />
                       <input type="password" placeholder="جدید" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-accent transition-colors" />
                       <input type="password" placeholder="تکرار" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-accent transition-colors" />
                       {passwordMessage && <div className={`text-xs p-2 rounded ${passwordMessage.type === 'success' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{passwordMessage.text}</div>}
                       <button type="submit" className="w-full bg-accent hover:bg-sky-400 text-white font-bold py-3 rounded-xl text-sm mt-2 transition-colors">ذخیره</button>
                    </form>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
