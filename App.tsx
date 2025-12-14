
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

const LOGO_URL: string = ""; 

const CompanyLogo = ({ name, className, bgColor }: { name: string, className?: string, bgColor?: string }) => {
  if (LOGO_URL && LOGO_URL.length > 10) {
      return (
        <div className={`relative overflow-hidden flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 ${className}`} style={{ backgroundColor: bgColor || '#ffffff' }}>
          <img src={LOGO_URL} alt={name} className="h-full object-contain p-2 w-full" />
        </div>
      );
  }

  return (
    <div className={`relative overflow-hidden flex flex-col items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 dark:bg-slate-800 ${className}`} style={{ backgroundColor: bgColor || '#ffffff' }}>
      <svg viewBox="0 0 200 200" className="w-full h-full p-3" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#991b1b', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:'#7f1d1d', stopOpacity:1}} />
          </linearGradient>
        </defs>
        <path d="M100 20 L180 170 H20 L100 20 Z" fill="url(#grad1)" opacity="0.1" />
        <path d="M40 160 L100 130 L160 160 L100 190 Z" fill="#7f1d1d" />
        <path d="M50 120 L100 90 L150 120 L100 150 Z" fill="#64748b" />
        <path d="M60 80 L100 50 L140 80 L100 110 Z" fill="#991b1b" />
        <path d="M100 50 L120 65 L100 80 L80 65 Z" fill="#ffffff" opacity="0.2" />
      </svg>
    </div>
  );
};

const AnalyticsDashboard = ({ history }: { history: InspectionForm[] }) => {
    const totalItems = history.reduce((acc, curr) => acc + curr.items.length, 0);
    const failItems = history.reduce((acc, curr) => acc + curr.items.filter(i => i.status === InspectionStatus.FAIL).length, 0);
    const passItems = history.reduce((acc, curr) => acc + curr.items.filter(i => i.status === InspectionStatus.PASS).length, 0);
    
    const failPercent = totalItems ? (failItems / totalItems) * 100 : 0;
    const passPercent = totalItems ? (passItems / totalItems) * 100 : 0;
    
    const last5Days = Array.from({length: 5}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('fa-IR');
    }).reverse();
    
    const activityPerDay = last5Days.map(date => {
        return history.filter(h => new Date(h.timestamp).toLocaleDateString('fa-IR') === date).length;
    });
    
    const maxActivity = Math.max(...activityPerDay, 5);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
  const [theme, setTheme] = useState<string>(localStorage.getItem('app_theme') || 'light');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [selectedHistoryIndices, setSelectedHistoryIndices] = useState<number[]>([]);

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
    console.log("App Version: V1.1.3");
  }, []);

  useEffect(() => {
    if (user) {
      const savedAvatar = localStorage.getItem(`user_avatar_${user.code}`);
      setUserAvatar(savedAvatar);
    } else {
      setUserAvatar(null);
    }
  }, [user]);

  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

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
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 z-50 shadow-[0_0_20px_rgba(16,185,129,0.6)]"></div>

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
           <span>V1.1.3</span>
           <span className="uppercase tracking-widest">Design By H.Parsa</span>
        </div>
      </div>
    );
  }

  // --- Header Component for Internal Pages ---
  const Header = ({ title, showBack = false, onBack, rightElement }: { title: string, showBack?: boolean, onBack?: () => void, rightElement?: React.ReactNode }) => (
    <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
      <div className="flex items-center justify-between px-4 h-16">
         <div className="flex items-center gap-3">
             {showBack && (
                 <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                     <ChevronRight size={20} />
                 </button>
             )}
             <h1 className="font-bold text-lg text-slate-800 dark:text-white">{title}</h1>
         </div>
         <div>
             {rightElement}
         </div>
      </div>
    </div>
  );

  if (view === AppView.HOME) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pb-20 font-sans transition-colors duration-300">
        <Header 
            title="خانه" 
            rightElement={
                <div className="flex items-center gap-2">
                    <button onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 transition-all">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <div onClick={() => setShowSettings(!showSettings)} className="relative cursor-pointer">
                        {userAvatar ? (
                            <img src={userAvatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm">
                                <UserIcon size={20} className="text-slate-500 dark:text-slate-400" />
                            </div>
                        )}
                    </div>
                </div>
            }
        />

        {/* Settings Dropdown */}
        {showSettings && (
            <div className="absolute top-16 left-4 right-4 z-40 animate-fade-in-up">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="relative group">
                                {userAvatar ? (
                                    <img src={userAvatar} alt="Profile" className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white dark:border-slate-600" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-md border-2 border-white dark:border-slate-600">
                                        <UserIcon size={32} className="text-slate-400" />
                                    </div>
                                )}
                                <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full cursor-pointer shadow-sm hover:bg-blue-600 transition-colors">
                                    <Camera size={12} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                </label>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white">{user?.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.org}</p>
                            </div>
                        </div>
                        {userAvatar && (
                            <button onClick={handleAvatarReset} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                                <Trash2 size={12} /> حذف تصویر پروفایل
                            </button>
                        )}
                    </div>
                    
                    <div className="p-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 pr-1">تغییر رمز عبور</h4>
                        <form onSubmit={handleChangePassword} className="space-y-3">
                            <input type="password" placeholder="رمز عبور فعلی" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all dark:text-white" />
                            <input type="password" placeholder="رمز عبور جدید" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all dark:text-white" />
                            <input type="password" placeholder="تکرار رمز عبور جدید" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all dark:text-white" />
                            
                            {passwordMessage && (
                                <div className={`text-xs p-2 rounded-lg ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    {passwordMessage.text}
                                </div>
                            )}
                            
                            <button type="submit" className="w-full bg-slate-800 dark:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors">ذخیره تغییرات</button>
                        </form>
                    </div>

                    <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-3 rounded-xl transition-colors text-sm font-bold">
                            <LogOut size={18} />
                            <span>خروج از حساب</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="p-4 space-y-6">
            <AnalyticsDashboard history={inspectionHistory} />

            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setView(AppView.SCANNER)} className="col-span-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/30 flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98] group relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-white/20 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <ScanLine size={42} />
                    </div>
                    <span className="font-black text-xl tracking-tight">شروع بازرسی جدید</span>
                    <span className="text-blue-100 text-sm font-medium opacity-90">اسکن QR Code تجهیز</span>
                </button>

                <button onClick={() => setView(AppView.ASSET_SEARCH)} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-3 hover:border-blue-200 dark:hover:border-blue-800 transition-all active:scale-95 group">
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-2xl text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <Search size={28} />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">جستجوی تجهیز</span>
                </button>

                <button onClick={() => setView(AppView.HISTORY)} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-3 hover:border-blue-200 dark:hover:border-blue-800 transition-all active:scale-95 group">
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-2xl text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <History size={28} />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">سوابق بازرسی</span>
                </button>
            </div>
            
            {/* Quick Actions / Recent */}
            <div className="pt-2">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">بازرسی‌های اخیر</h3>
                    <button onClick={() => setView(AppView.HISTORY)} className="text-blue-500 text-xs font-bold hover:text-blue-600 flex items-center gap-1">
                        مشاهده همه <ChevronRight size={14} className="rtl:rotate-180"/>
                    </button>
                </div>
                
                <div className="space-y-3">
                    {inspectionHistory.length > 0 ? (
                        inspectionHistory.slice(0, 3).map((item, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${item.items.some(i => i.status === InspectionStatus.FAIL) ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-green-50 dark:bg-green-900/20 text-green-500'}`}>
                                        {item.items.some(i => i.status === InspectionStatus.FAIL) ? <AlertTriangle size={20}/> : <ClipboardCheck size={20}/>}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{item.equipmentName}</h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <Clock size={12} />
                                            <span>{formatHistoryDate(item.timestamp)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="inline-flex bg-slate-100 dark:bg-slate-700 p-3 rounded-full mb-3 text-slate-400">
                                <ClipboardCheck size={24} />
                            </div>
                            <p className="text-slate-400 text-sm">هنوز بازرسی انجام نشده است</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (view === AppView.SCANNER) {
    return <QRScanner onScan={handleScan} onClose={() => setView(AppView.HOME)} />;
  }
  
  if (view === AppView.ASSET_SEARCH) {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans">
              <Header title="جستجوی دستی تجهیز" showBack onBack={() => setView(AppView.HOME)} />
              <div className="p-6">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                      <div className="mb-6 text-center">
                          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                              <Search size={32} />
                          </div>
                          <h3 className="font-bold text-slate-800 dark:text-white mb-2">کد تجهیز را وارد کنید</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">برای شروع بازرسی، کد یکتای تجهیز را وارد نمایید</p>
                      </div>
                      
                      <div className="space-y-4">
                          <input 
                              type="text" 
                              placeholder="مثال: EHALBF0001" 
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-4 text-center outline-none focus:border-blue-500 transition-all font-mono tracking-wider dark:text-white"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                          />
                          <button 
                              disabled={!searchTerm.trim()}
                              onClick={() => handleScan(searchTerm)}
                              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                              <span>جستجو و ادامه</span>
                              <ArrowRight size={20} className="rtl:rotate-180"/>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (view === AppView.ACTIVITY_SELECT) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans pb-20">
        <Header title="انتخاب فعالیت" showBack onBack={() => setView(AppView.HOME)} />
        <div className="p-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6 flex items-start gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                    <Building2 size={24} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{currentEquipment?.name}</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md w-fit">
                        <Barcode size={14} />
                        {currentEquipment?.id}
                    </div>
                </div>
            </div>

            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-3 pr-1">فعالیت‌های موجود برای این تجهیز:</h3>
            <div className="space-y-3">
                {availableActivities.map((activity) => (
                    <button 
                        key={activity.code}
                        onClick={() => startInspection(currentEquipment!, activity)}
                        className="w-full bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all text-right group relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white mb-1">{activity.name}</h4>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-left inline-block mt-1">{activity.code}</span>
                            </div>
                            <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors rtl:rotate-180" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </div>
    );
  }

  if (view === AppView.FORM) {
    const progress = calculateProgress();
    
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans pb-24">
        <Header 
            title={selectedActivity ? selectedActivity.name : 'بازرسی عمومی'} 
            showBack 
            onBack={() => {
                if (window.confirm('آیا مطمئن هستید؟ اطلاعات فرم از دست خواهد رفت.')) {
                    setView(AppView.HOME);
                }
            }}
        />

        {/* Progress Bar Fixed Top */}
        <div className="sticky top-16 z-20 bg-slate-50/95 dark:bg-[#0f172a]/95 backdrop-blur-sm px-4 py-3 border-b border-slate-200 dark:border-slate-800">
             <div className="flex justify-between items-end mb-1">
                 <span className="text-xs font-bold text-slate-500 dark:text-slate-400">پیشرفت تکمیل فرم</span>
                 <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
             </div>
             <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                 <div className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
             </div>
        </div>

        <div className="p-4">
            {loadingChecklist ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 size={40} className="animate-spin text-blue-500" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">در حال ایجاد چک‌لیست هوشمند...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {checklistItems.map((item) => (
                        <ChecklistItem 
                            key={item.id} 
                            item={item} 
                            onChange={handleUpdateItem} 
                        />
                    ))}
                </div>
            )}
        </div>

        {/* Floating Submit Action */}
        {!loadingChecklist && (
            <div className="fixed bottom-0 left-0 w-full p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-30">
                <div className="max-w-md mx-auto flex items-center gap-4">
                    <div className="flex-1">
                       {getIncompleteCount() > 0 ? (
                           <p className="text-xs text-orange-500 dark:text-orange-400 font-medium text-center">
                               {getIncompleteCount()} آیتم باقی‌مانده است
                           </p>
                       ) : (
                           <p className="text-xs text-green-500 font-medium text-center">
                               همه موارد تکمیل شده‌اند
                           </p>
                       )}
                    </div>
                    <button 
                        onClick={handleSubmit}
                        disabled={getIncompleteCount() > 0}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <span>ثبت نهایی گزارش</span>
                        <CheckCircle2 size={20} />
                    </button>
                </div>
            </div>
        )}
      </div>
    );
  }

  if (view === AppView.SUBMITTING) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-sm w-full">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full"></div>
                <div className="relative bg-blue-50 dark:bg-blue-900/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                    <Loader2 size={40} className="animate-spin text-blue-600 dark:text-blue-400" />
                </div>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">در حال پردازش...</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                هوش مصنوعی در حال تحلیل گزارش و بررسی خرابی‌های احتمالی است.
            </p>
        </div>
      </div>
    );
  }

  if (view === AppView.SUCCESS) {
    return (
      <div className="min-h-screen bg-green-50 dark:bg-[#052e16] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl border border-white/50 dark:border-white/10 max-w-md w-full relative z-10 animate-fade-in-up">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
            </div>
            
            <h2 className="text-2xl font-black text-center text-slate-800 dark:text-white mb-2">ثبت موفقیت‌آمیز</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-8">گزارش بازرسی با موفقیت در سیستم ثبت گردید.</p>
            
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 mb-8 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                         <Building2 size={16} />
                    </div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">تحلیل هوشمند AI</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-7 text-justify bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    {analysisResult}
                </p>
            </div>

            <div className="space-y-3">
                <button 
                    onClick={handleShareReport}
                    className="w-full bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <Share2 size={20} />
                    <span>اشتراک‌گذاری گزارش</span>
                </button>
                <button 
                    onClick={resetApp}
                    className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-4 rounded-xl shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98]"
                >
                    بازگشت به خانه
                </button>
            </div>
        </div>
      </div>
    );
  }

  if (view === AppView.HISTORY) {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans pb-20">
              <Header 
                  title="سوابق بازرسی" 
                  showBack 
                  onBack={() => setView(AppView.HOME)}
                  rightElement={
                      <div className="flex gap-2">
                        <button 
                            onClick={handleExportCSV}
                            className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                            title="دانلود اکسل"
                        >
                            <Download size={20} />
                        </button>
                        <button
                            onClick={selectAllHistory}
                            className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            title="انتخاب همه"
                        >
                            <CheckSquare size={20} />
                        </button>
                      </div>
                  } 
              />
              
              <div className="p-4 space-y-4">
                  {inspectionHistory.length === 0 ? (
                      <div className="text-center py-20 opacity-50">
                          <History size={48} className="mx-auto mb-4 text-slate-400" />
                          <p>هیچ سابقه‌ای موجود نیست</p>
                      </div>
                  ) : (
                      inspectionHistory.map((report, index) => (
                          <div 
                            key={index} 
                            onClick={() => toggleHistorySelection(index)}
                            className={`bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border transition-all cursor-pointer relative overflow-hidden ${
                                selectedHistoryIndices.includes(index) 
                                ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10' 
                                : 'border-slate-100 dark:border-slate-700'
                            }`}
                          >
                              {selectedHistoryIndices.includes(index) && (
                                  <div className="absolute top-0 right-0 w-4 h-4 bg-blue-500 rounded-bl-lg z-10"></div>
                              )}
                              
                              <div className="flex justify-between items-start mb-3">
                                  <div>
                                      <h3 className="font-bold text-slate-800 dark:text-white text-base">{report.equipmentName}</h3>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{report.activityName || 'بازرسی عمومی'}</p>
                                  </div>
                                  <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-slate-500 dark:text-slate-300 font-mono">
                                      {formatHistoryDate(report.timestamp)}
                                  </span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700 pt-3">
                                  <div className="flex items-center gap-1">
                                      <UserIcon size={14} className="text-slate-400"/>
                                      <span>{report.inspectorName}</span>
                                  </div>
                                  <div className="flex items-center gap-3 mr-auto">
                                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                          <CheckCircle2 size={14} />
                                          <span className="font-bold">{report.items.filter(i => i.status === InspectionStatus.PASS).length}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-red-500 dark:text-red-400">
                                          <AlertTriangle size={14} />
                                          <span className="font-bold">{report.items.filter(i => i.status === InspectionStatus.FAIL).length}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      );
  }

  // Fallback
  return null;
}
