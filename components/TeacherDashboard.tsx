import React, { useState } from 'react';
import { useAttendance } from '../contexts/AttendanceContext';
import { analyzeAttendance } from '../services/geminiService';
import { saveFirebaseConfigToLocal, clearFirebaseConfig, getFirebaseConfigFromLocal } from '../services/firebaseService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BrainCircuit, Trash2, RefreshCw, Users, Plus, X, Settings, LockKeyhole, Check, Cloud, CloudOff, HelpCircle } from 'lucide-react';

const CloudConfigModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { connectCloud, disconnectCloud, isCloudMode } = useAttendance();
  const [configJson, setConfigJson] = useState('');
  const [error, setError] = useState('');
  
  const storedConfig = getFirebaseConfigFromLocal();

  const handleConnect = async () => {
    try {
        setError('');
        const config = JSON.parse(configJson);
        // Basic validation
        if (!config.apiKey || !config.databaseURL) {
            throw new Error("配置缺少 apiKey 或 databaseURL");
        }
        
        saveFirebaseConfigToLocal(config);
        await connectCloud(config);
        onClose();
    } catch (e: any) {
        setError("配置格式错误或连接失败: " + e.message);
    }
  };

  const handleDisconnect = () => {
      if(window.confirm("确定要断开同步吗？应用将回到单机模式。")) {
          clearFirebaseConfig();
          disconnectCloud();
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <Cloud className="w-6 h-6 text-blue-600" />
             多设备云同步设置
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCloudMode ? (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-800">已连接云端数据库</h4>
                <p className="text-slate-500 mt-2 mb-6">数据正在多台设备间实时同步。</p>
                <button 
                    onClick={handleDisconnect}
                    className="bg-red-50 text-red-600 px-6 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2 mx-auto"
                >
                    <CloudOff className="w-4 h-4" /> 断开连接
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
                    <p className="font-bold flex items-center gap-2 mb-2">
                        <HelpCircle className="w-4 h-4" /> 如何获取配置?
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                        <li>前往 <a href="https://console.firebase.google.com/" target="_blank" className="underline">Firebase Console</a> 创建项目。</li>
                        <li>在 Build 菜单中选择 <strong>Realtime Database</strong> 并创建数据库。</li>
                        <li><strong>重要：</strong>在 Rules 选项卡中，选择 <strong>Test Mode (测试模式)</strong> 以允许读写。</li>
                        <li>在项目设置 (Project Settings) 中添加 Web App，复制 <code>firebaseConfig</code> 对象。</li>
                    </ol>
                </div>

                <textarea 
                    value={configJson}
                    onChange={e => setConfigJson(e.target.value)}
                    placeholder={'粘贴类似格式:\n{\n  "apiKey": "AIza...",\n  "authDomain": "...",\n  "databaseURL": "https://...",\n  "projectId": "..."\n}'}
                    className="w-full h-40 p-4 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                
                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button 
                    onClick={handleConnect}
                    disabled={!configJson.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    启用云同步
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const currentStored = localStorage.getItem('eduTrackerAdminPwd') || 'admin';

    if (oldPassword !== currentStored) {
      setError('旧密码不正确');
      return;
    }

    if (newPassword.length < 4) {
        setError('新密码至少需要4个字符');
        return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    localStorage.setItem('eduTrackerAdminPwd', newPassword);
    setSuccess(true);
    
    setTimeout(() => {
        onClose();
    }, 1500);
  };

  if (success) {
    return (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-8 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">修改成功</h3>
                <p className="text-slate-500 mt-2">下次登录请使用新密码。</p>
            </div>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <LockKeyhole className="w-5 h-5 text-blue-600" />
             修改管理员密码
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">当前密码</label>
            <input 
              type="password" 
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">新密码</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">确认新密码</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100 text-center">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors mt-2"
          >
            确认修改
          </button>
        </form>
      </div>
    </div>
  );
};

const TeacherDashboard: React.FC = () => {
  const { 
    getAggregatedStats, 
    resetData, 
    activeSessions, 
    groups, 
    students,
    addGroup,
    removeGroup,
    addStudent,
    removeStudent,
    isCloudMode
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<'stats' | 'manage'>('stats');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  
  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');

  const stats = getAggregatedStats();

  const chartData = stats.map(s => ({
    name: s.studentName,
    hours: parseFloat((s.totalDurationMs / (1000 * 60 * 60)).toFixed(2)),
    team: s.teamNumber
  })).slice(0, 10); // Top 10 for chart

  const handleGenerateReport = async () => {
    setLoadingAi(true);
    const report = await analyzeAttendance(stats);
    setAiReport(report);
    setLoadingAi(false);
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if(newGroupName.trim()) {
        addGroup(newGroupName);
        setNewGroupName('');
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
      e.preventDefault();
      if(newStudentName.trim() && targetGroupId) {
          addStudent(newStudentName, targetGroupId);
          setNewStudentName('');
      }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {showPwdModal && <ChangePasswordModal onClose={() => setShowPwdModal(false)} />}
      {showCloudModal && <CloudConfigModal onClose={() => setShowCloudModal(false)} />}

      {/* Dashboard Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 mb-6">
        <div className="flex">
            <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2
                ${activeTab === 'stats' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
            <BrainCircuit className="w-4 h-4" /> 数据统计 & AI
            </button>
            <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2
                ${activeTab === 'manage' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
            <Settings className="w-4 h-4" /> 名单管理
            </button>
        </div>
        
        <div className="py-2 px-4 sm:px-0 flex items-center gap-3">
            <button 
                onClick={() => setShowCloudModal(true)}
                className={`text-sm flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg
                    ${isCloudMode ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:text-blue-600'}`}
            >
                {isCloudMode ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                {isCloudMode ? '已同步' : '云同步'}
            </button>
            <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
            <button 
                onClick={() => setShowPwdModal(true)}
                className="text-slate-500 hover:text-blue-600 text-sm flex items-center gap-1 transition-colors"
            >
                <LockKeyhole className="w-4 h-4" /> 修改密码
            </button>
        </div>
      </div>

      {activeTab === 'stats' ? (
        <>
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm font-medium">总学生数</p>
                <p className="text-3xl font-bold text-slate-800">{stats.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm font-medium">当前活跃</p>
                <p className="text-3xl font-bold text-emerald-600">{activeSessions.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm font-medium">总时长累计</p>
                <p className="text-3xl font-bold text-blue-600">
                    {formatDuration(stats.reduce((acc, curr) => acc + curr.totalDurationMs, 0))}
                </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Data Column */}
                <div className="lg:col-span-2 space-y-6">
                    
                {/* Chart Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">时长 Top 10 排行榜</h3>
                    <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" unit="h" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="hours" fill="#4F46E5" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index < 3 ? '#4F46E5' : '#94a3b8'} />
                            ))}
                        </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">详细数据表</h3>
                    <button 
                        onClick={resetData}
                        className="text-red-500 text-sm hover:bg-red-50 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <Trash2 className="w-4 h-4" /> 清空打卡记录
                    </button>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">姓名</th>
                            <th className="px-6 py-3">分组 (Team)</th>
                            <th className="px-6 py-3">打卡次数</th>
                            <th className="px-6 py-3 text-right">总时长</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {stats.length === 0 ? (
                            <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400">暂无数据，请先在“名单管理”中添加学生。</td>
                            </tr>
                        ) : (
                            stats.map((s) => (
                            <tr key={s.studentId} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-3 font-medium text-slate-900">{s.studentName}</td>
                                <td className="px-6 py-3 text-slate-600">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{s.teamNumber}</span>
                                </td>
                                <td className="px-6 py-3 text-slate-600">{s.sessionCount}</td>
                                <td className="px-6 py-3 text-right font-mono text-blue-600 font-medium">
                                {formatDuration(s.totalDurationMs)}
                                </td>
                            </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                    </div>
                </div>
                </div>

                {/* AI Sidebar */}
                <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6" />
                        AI 智能周报
                    </h3>
                    </div>
                    <p className="text-indigo-100 text-sm mb-6">
                    利用 Gemini AI 自动分析学生的出勤模式，找出需要关注的学生。
                    </p>
                    <button
                    onClick={handleGenerateReport}
                    disabled={loadingAi || stats.length === 0}
                    className="w-full bg-white text-indigo-600 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                    {loadingAi ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                        <BrainCircuit className="w-5 h-5" />
                    )}
                    {loadingAi ? '正在分析...' : '生成分析报告'}
                    </button>
                </div>

                {aiReport && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 animate-fade-in relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-xl" />
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="text-xl">📊</span> 分析结果
                        </h4>
                        <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {aiReport}
                        </div>
                    </div>
                )}
                </div>
            </div>
        </>
      ) : (
        // MANAGEMENT TAB
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Group Management */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5" /> 新建分组
                    </h3>
                    <form onSubmit={handleAddGroup} className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            placeholder="输入分组名称..." 
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button type="submit" disabled={!newGroupName.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            <Plus className="w-5 h-5" />
                        </button>
                    </form>
                    
                    <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">现有分组</h4>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {groups.length === 0 && <p className="text-slate-400 text-sm">暂无分组</p>}
                        {groups.map(g => (
                            <div key={g.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg group hover:bg-slate-100 transition-colors">
                                <span className="font-medium text-slate-700">{g.name}</span>
                                <button 
                                    onClick={() => removeGroup(g.id)}
                                    title="删除分组将同时删除组内学生"
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Student Management */}
            <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5" /> 添加学生
                    </h3>
                    
                    {groups.length === 0 ? (
                        <div className="bg-amber-50 text-amber-700 p-4 rounded-lg mb-6">
                            请先在左侧创建至少一个分组。
                        </div>
                    ) : (
                        <form onSubmit={handleAddStudent} className="flex flex-col sm:flex-row gap-2 mb-8 p-4 bg-slate-50 rounded-xl">
                            <select 
                                value={targetGroupId} 
                                onChange={e => setTargetGroupId(e.target.value)}
                                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">选择分组...</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <input 
                                type="text" 
                                placeholder="学生姓名..." 
                                value={newStudentName}
                                onChange={e => setNewStudentName(e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button 
                                type="submit" 
                                disabled={!newStudentName.trim() || !targetGroupId} 
                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" /> 添加
                            </button>
                        </form>
                    )}

                    <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">所有学生名单</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                        {students.length === 0 && <p className="col-span-2 text-slate-400 text-center py-8">暂无学生数据</p>}
                        {students.map(s => {
                            const group = groups.find(g => g.id === s.groupId);
                            return (
                                <div key={s.id} className="flex justify-between items-center border border-slate-200 p-3 rounded-lg hover:shadow-sm transition-shadow bg-white">
                                    <div>
                                        <p className="font-bold text-slate-800">{s.name}</p>
                                        <p className="text-xs text-slate-500 bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">
                                            {group ? group.name : '未分组'}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => removeStudent(s.id)}
                                        className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;