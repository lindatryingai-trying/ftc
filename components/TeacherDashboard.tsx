
import React, { useState, useMemo } from 'react';
import { useAttendance } from '../contexts/AttendanceContext';
import { analyzeAttendance } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BrainCircuit, Trash2, RefreshCw, Users, Plus, X, Settings, LockKeyhole, Check, Database, Cloud, AlertCircle, Link2, Wifi, WifiOff, History, Calendar, Clock, ChevronRight } from 'lucide-react';
import CloudSetupModal from './CloudSetupModal';

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

const StudentHistoryModal: React.FC<{ studentId: string; onClose: () => void }> = ({ studentId, onClose }) => {
    const { sessions, students, groups } = useAttendance();

    const student = students.find(s => s.id === studentId);
    const group = groups.find(g => g.id === student?.groupId);

    const history = useMemo(() => {
        return sessions
            .filter(s => s.studentId === studentId)
            .sort((a, b) => b.startTime - a.startTime);
    }, [sessions, studentId]);

    const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDate = (ts: number) => new Date(ts).toLocaleDateString();
    const formatDuration = (start: number, end: number | null) => {
        if (!end) return "进行中...";
        const ms = end - start;
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    if (!student) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                             {student.name} 
                             <span className="text-sm font-normal text-slate-500 bg-white px-2 py-0.5 rounded border">
                                {group?.name || '未分组'}
                             </span>
                        </h3>
                        <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                            <History className="w-3.5 h-3.5" /> 共打卡 {history.length} 次
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full hover:bg-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            暂无打卡记录
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 sticky top-0 text-slate-500 font-medium z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3">日期</th>
                                    <th className="px-6 py-3">时间段</th>
                                    <th className="px-6 py-3 text-right">时长</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.map(session => {
                                    const isOngoing = session.endTime === null;
                                    return (
                                        <tr key={session.id} className={isOngoing ? "bg-green-50" : ""}>
                                            <td className="px-6 py-4 text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {formatDate(session.startTime)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    {formatTime(session.startTime)} - {session.endTime ? formatTime(session.endTime) : <span className="text-green-600 font-bold animate-pulse">进行中</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-medium">
                                                {formatDuration(session.startTime, session.endTime)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
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
    jsonBinConfig,
    cloudStatus,
    lastSyncedAt
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<'stats' | 'manage'>('stats');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [viewHistoryStudentId, setViewHistoryStudentId] = useState<string | null>(null);
  
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
      {showCloudModal && <CloudSetupModal onClose={() => setShowCloudModal(false)} />}
      {viewHistoryStudentId && <StudentHistoryModal studentId={viewHistoryStudentId} onClose={() => setViewHistoryStudentId(null)} />}

      {/* Dashboard Tabs & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 mb-6 gap-4 md:gap-0">
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
        
        <div className="py-2 px-4 md:px-0 flex flex-wrap items-center gap-3">
            <button 
                onClick={() => setShowCloudModal(true)}
                className={`text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all border
                    ${jsonBinConfig 
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
            >
                {cloudStatus === 'syncing' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Database className="w-3.5 h-3.5" />
                )}
                {jsonBinConfig ? (
                    <span className="flex items-center gap-1">
                        已连接
                        {cloudStatus === 'idle' && (
                             <span className="relative flex h-2 w-2 ml-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                        )}
                    </span>
                ) : '连接数据库'}
            </button>

            <div className="h-4 w-[1px] bg-slate-300 mx-1 hidden md:block"></div>

            <button 
                onClick={() => setShowPwdModal(true)}
                className="text-slate-500 hover:text-blue-600 text-sm flex items-center gap-1 transition-colors"
            >
                <LockKeyhole className="w-4 h-4" /> 修改密码
            </button>
        </div>
      </div>
      
      {/* Live Indicator */}
      {jsonBinConfig && (
        <div className="text-xs text-right text-slate-400 -mt-4 mb-4 px-2 flex items-center justify-end gap-2">
            {cloudStatus === 'syncing' && <span>同步中...</span>}
            {lastSyncedAt && cloudStatus !== 'syncing' && (
                <span>上次更新: {new Date(lastSyncedAt).toLocaleTimeString()}</span>
            )}
            {cloudStatus === 'error' && (
                 <span className="text-red-400 flex items-center gap-1">
                     <WifiOff className="w-3 h-3" /> 网络异常
                 </span>
            )}
        </div>
      )}

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
                    {/* Increased height to 500px to show all 10 items clearly */}
                    <div className="h-[500px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" unit="h" />
                        <YAxis dataKey="name" type="category" width={100} interval={0} />
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
                    <h3 className="text-lg font-bold text-slate-800">详细数据表 (点击学生查看详情)</h3>
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
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400">暂无数据，请先在“名单管理”中添加</td>
                            </tr>
                        ) : (
                            stats.map(stat => (
                            <tr 
                                key={stat.studentId} 
                                className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                onClick={() => setViewHistoryStudentId(stat.studentId)}
                                title="点击查看详细打卡时间"
                            >
                                <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-2 group-hover:text-blue-600">
                                    {stat.studentName}
                                    {activeSessions.some(s => s.studentId === stat.studentId) && (
                                        <span className="relative flex h-2 w-2" title="正在打卡">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-slate-500">{stat.teamNumber}</td>
                                <td className="px-6 py-4 text-slate-500">{stat.sessionCount}</td>
                                <td className="px-6 py-4 text-right font-mono text-slate-700 flex items-center justify-end gap-2">
                                    {formatDuration(stat.totalDurationMs)}
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
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
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <BrainCircuit className="w-6 h-6" /> Gemini AI 分析
                    </h3>
                    <p className="text-indigo-100 text-sm mb-6">
                    让 AI 助教分析本周的出勤情况，生成个性化周报和建议。
                    </p>
                    <button
                    onClick={handleGenerateReport}
                    disabled={loadingAi || stats.length === 0}
                    className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/40 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {loadingAi ? <RefreshCw className="w-5 h-5 animate-spin" /> : "生成周报点评"}
                    </button>
                </div>

                {aiReport && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-fade-in">
                    <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">分析报告</h4>
                    <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                        {aiReport}
                    </div>
                    </div>
                )}
                </div>
            </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Group Management */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5" /> 分组管理
                    </h3>
                </div>
                <div className="p-6">
                    <form onSubmit={handleAddGroup} className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="输入新分组名称 (如: 28119)"
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <button 
                            type="submit"
                            disabled={!newGroupName.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {groups.map(group => (
                            <div key={group.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="font-medium text-slate-700">{group.name}</span>
                                <button 
                                    onClick={() => {
                                        if(confirm(`确定要删除 ${group.name} 及其所有学生吗?`)) removeGroup(group.id);
                                    }}
                                    className="text-slate-400 hover:text-red-500 p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {groups.length === 0 && <p className="text-center text-slate-400 py-4">暂无分组</p>}
                    </div>
                </div>
            </div>

            {/* Student Management */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5" /> 学生名单
                    </h3>
                </div>
                <div className="p-6">
                     <form onSubmit={handleAddStudent} className="flex flex-col sm:flex-row gap-2 mb-6">
                         <select 
                            value={targetGroupId}
                            onChange={(e) => setTargetGroupId(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                         >
                             <option value="">选择分组...</option>
                             {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                         </select>
                        <input 
                            type="text" 
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            placeholder="学生姓名"
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <button 
                            type="submit"
                            disabled={!newStudentName.trim() || !targetGroupId}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 sm:w-auto w-full"
                        >
                            <Plus className="w-5 h-5 mx-auto" />
                        </button>
                    </form>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {students.map(student => {
                            const groupName = groups.find(g => g.id === student.groupId)?.name || 'Unknown';
                            return (
                                <div key={student.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-700">{student.name}</span>
                                        <span className="text-xs text-slate-400">{groupName}</span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if(confirm(`确定要删除 ${student.name} 吗?`)) removeStudent(student.id);
                                        }}
                                        className="text-slate-400 hover:text-red-500 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                         {students.length === 0 && <p className="text-center text-slate-400 py-4">暂无学生</p>}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
