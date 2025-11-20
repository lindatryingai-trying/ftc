
import React, { useState, useEffect } from 'react';
import { AttendanceProvider, useAttendance } from './contexts/AttendanceContext';
import StudentCheckIn from './components/StudentCheckIn';
import TeacherDashboard from './components/TeacherDashboard';
import { LayoutDashboard, UserCheck, GraduationCap, Share, X, PlusSquare, QrCode, Copy, Check, Smartphone, MoreVertical, Lock, Cloud } from 'lucide-react';

// Component to guide iOS users to add to home screen
const IOSInstallPrompt: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Detect iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Check if already running in standalone mode (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    // Only show if on iOS and NOT in standalone mode
    if (isIOS && !isStandalone) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-[100] animate-slide-up">
      <div className="max-w-lg mx-auto relative">
        <button 
          onClick={() => setShow(false)} 
          className="absolute -top-2 -right-2 p-2 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="bg-slate-100 p-3 rounded-xl flex-shrink-0">
             <PlusSquare className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">安装到手机桌面</h3>
            <p className="text-slate-600 text-sm mt-1 leading-relaxed">
              为了获得最佳体验，请将此应用安装到您的手机。
            </p>
            <div className="mt-3 text-sm text-slate-500 flex flex-col gap-2">
               <div className="flex items-center gap-2">
                  <span className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                  <span>点击浏览器底部的 <Share className="w-4 h-4 inline mx-1" /> 分享按钮</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                  <span>向下滑动并选择 <strong>“添加到主屏幕”</strong></span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShareModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'install'>('scan');
  const { jsonBinConfig } = useAttendance();
  
  // Construct URL: If connected to cloud, append credentials for auto-setup on other devices
  let shareUrl = window.location.href.split('?')[0];
  if (jsonBinConfig) {
      shareUrl += `?binId=${jsonBinConfig.binId}&apiKey=${jsonBinConfig.apiKey}`;
  }

  // Using a reliable public QR code API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-800 p-4 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold flex items-center gap-2">
            <Smartphone className="w-5 h-5" /> 手机访问与同步
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b border-slate-200 shrink-0">
           <button 
             onClick={() => setActiveTab('scan')} 
             className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'scan' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             扫码同步 (推荐)
           </button>
           <button 
             onClick={() => setActiveTab('install')} 
             className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'install' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             安装教程 (App)
           </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {activeTab === 'scan' ? (
            <div className="flex flex-col items-center text-center">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm mb-6">
                <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain" />
              </div>
              
              <p className="text-slate-800 font-bold mb-2">
                  {jsonBinConfig ? '学生扫码自动连接' : '扫码在手机上打开'}
              </p>
              <p className="text-slate-500 text-sm mb-6">
                {jsonBinConfig ? '扫描此码，学生端将自动同步最新的分组和名单。' : '推荐使用手机系统相机扫码。'}
              </p>

              <div className="w-full relative">
                 <input 
                  type="text" 
                  readOnly 
                  value={shareUrl} 
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none text-ellipsis"
                 />
                 <button 
                  onClick={handleCopy}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="复制链接"
                 >
                   {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                 </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🍎</span> iOS (iPhone/iPad)
                </h4>
                <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                  <li>使用 <strong>Safari</strong> 浏览器打开本页。</li>
                  <li>点击底部的 <strong>分享按钮</strong> <Share className="w-3 h-3 inline" />。</li>
                  <li>向下滑动菜单。</li>
                  <li>选择 <strong>“添加到主屏幕”</strong>。</li>
                  <li>点击右上角的“添加”。</li>
                </ol>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🤖</span> Android (安卓)
                </h4>
                <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                  <li>使用 <strong>Chrome</strong> 浏览器打开本页。</li>
                  <li>点击右上角的 <strong>菜单按钮</strong> <MoreVertical className="w-3 h-3 inline" />。</li>
                  <li>选择 <strong>“安装应用”</strong> 或 <strong>“添加到主屏幕”</strong>。</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LoginModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Get stored password or default to 'admin'
  const storedPassword = localStorage.getItem('eduTrackerAdminPwd') || 'admin';
  const isDefaultPassword = storedPassword === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === storedPassword) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <Lock className="w-5 h-5 text-blue-600" />
             管理员验证
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-sm text-slate-500 mb-2">请输入密码进入后台：</p>
            <input 
              type="password" 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 transition-all ${
                error 
                  ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                  : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
              }`}
              placeholder="请输入管理员密码"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-2">密码错误</p>}
            {isDefaultPassword && (
              <p className="text-slate-400 text-xs mt-2 italic">默认密码: admin</p>
            )}
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors"
          >
            确认
          </button>
        </form>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [view, setView] = useState<'student' | 'teacher'>('student');
  const [imgError, setImgError] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectMsg, setConnectMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  
  const { connectCloud } = useAttendance();

  // Auto-Config from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const binId = params.get('binId');
    const apiKey = params.get('apiKey');
    
    if (binId && apiKey) {
        // Automatically connect if credentials are present in URL
        connectCloud(binId, apiKey).then(() => {
            console.log("Auto-connected via URL");
            setConnectMsg({ type: 'success', text: '已自动连接到云端数据库！' });
            // Clean URL to hide keys
            window.history.replaceState({}, document.title, window.location.pathname);
        }).catch(e => {
            console.error("Auto-connect failed", e);
            setConnectMsg({ type: 'error', text: '连接失败，请让老师重新生成二维码。' });
        });
    }
  }, [connectCloud]);

  // Auto hide message
  useEffect(() => {
      if(connectMsg) {
          const timer = setTimeout(() => setConnectMsg(null), 5000);
          return () => clearTimeout(timer);
      }
  }, [connectMsg]);

  const handleTeacherClick = () => {
    if (isAuthenticated) {
      setView('teacher');
    } else {
      setShowLogin(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLogin(false);
    setView('teacher');
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Toast Notification */}
      {connectMsg && (
          <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[150] px-6 py-3 rounded-full shadow-lg text-sm font-bold animate-fade-in flex items-center gap-2
            ${connectMsg.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {connectMsg.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {connectMsg.text}
          </div>
      )}

      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!imgError ? (
              <img 
                src="logo.png" 
                alt="FTC Team Logo" 
                className="h-12 w-auto object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="h-12 w-12 flex items-center justify-center bg-blue-50 rounded-full text-blue-600">
                  <GraduationCap className="h-8 w-8" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">FTC28119&30222打卡机</h1>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight sm:hidden">FTC打卡机</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 -mt-1 hidden sm:block">智能考勤系统</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setView('student')}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2
                  ${view === 'student' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'}`}
              >
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline">学生打卡</span>
                <span className="sm:hidden">打卡</span>
              </button>
              <button
                onClick={handleTeacherClick}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2
                  ${view === 'teacher' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'}`}
              >
                {view === 'teacher' ? <LayoutDashboard className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span className="hidden sm:inline">教师后台</span>
                <span className="sm:hidden">后台</span>
              </button>
            </div>

            <button 
              onClick={() => setShowShare(true)}
              className="p-2.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-200"
              title="手机访问 / 安装 App"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {view === 'student' ? (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">欢迎来到学习中心</h2>
              <p className="text-slate-500 max-w-lg mx-auto">
                请在下方输入您的信息以开始记录学习时间。
                系统会自动统计您的每周进度。
              </p>
            </div>
            <StudentCheckIn />
          </div>
        ) : (
          <TeacherDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto mb-20 sm:mb-0">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© 2024 FTC Team 28119 & 30222 Attendance Tracker. All rights reserved.</p>
        </div>
      </footer>

      {/* Modals */}
      <IOSInstallPrompt />
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
      {showLogin && (
        <LoginModal 
          onClose={() => setShowLogin(false)} 
          onSuccess={handleLoginSuccess} 
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AttendanceProvider>
      <AppContent />
    </AttendanceProvider>
  );
};

export default App;
