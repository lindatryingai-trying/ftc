
import React, { useState, useEffect } from 'react';
import { useAttendance } from '../contexts/AttendanceContext';
import { generateStudentQuote } from '../services/geminiService';
import { CheckCircle, StopCircle, Users, ArrowLeft, ChevronRight, Database, RefreshCw, WifiOff, AlertCircle, Trophy, Medal } from 'lucide-react';
import CloudSetupModal from './CloudSetupModal';

const StudentCheckIn: React.FC = () => {
  const { 
    clockIn, 
    clockOut, 
    activeSessions, 
    groups, 
    students, 
    jsonBinConfig, 
    refreshData,
    cloudStatus,
    cloudError,
    getAggregatedStats
  } = useAttendance();
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiQuote, setAiQuote] = useState('');

  // Get stats for leaderboard
  const stats = getAggregatedStats();
  const top10 = stats.slice(0, 10);

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Reset selection after timeout if no action
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setAiQuote('');
        setSelectedGroupId(null);
        setSelectedStudentId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const activeSession = selectedStudentId 
    ? activeSessions.find(s => s.studentId === selectedStudentId) 
    : undefined;

  const handleRefresh = async () => {
      setIsRefreshing(true);
      try {
          await refreshData();
      } catch (e) {
          // Error handled in context
      } finally {
          setTimeout(() => setIsRefreshing(false), 500);
      }
  };

  const handleStart = () => {
    if (!selectedStudentId) return;
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    try {
      setError('');
      clockIn(selectedStudentId);
      setSuccessMsg(`欢迎, ${student.name}! 打卡开始。`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEnd = async () => {
    if (!activeSession || !selectedStudentId) return;
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    setLoading(true);
    try {
      const duration = Date.now() - activeSession.startTime;
      await clockOut(selectedStudentId);
      setSuccessMsg(`再见, ${student.name}! 打卡结束。`);
      
      // Trigger AI encouragement
      const quote = await generateStudentQuote(student.name, duration);
      setAiQuote(quote);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setSelectedStudentId(null);
    setSelectedGroupId(null);
    setError('');
  };

  // Render Groups Selection (Main Screen)
  if (!selectedGroupId) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in relative pb-10">
         {showCloudModal && <CloudSetupModal onClose={() => setShowCloudModal(false)} />}
         
         {/* Top Bar: Cloud Settings & Refresh */}
         <div className="absolute -top-10 right-0 sm:-right-2 flex items-center gap-2">
            {jsonBinConfig && (
                <button 
                    onClick={handleRefresh}
                    className={`p-1.5 rounded-lg border bg-white transition-all ${isRefreshing ? 'animate-spin text-blue-600 border-blue-200' : 'text-slate-400 border-slate-200 hover:text-blue-600 hover:border-blue-300'}`}
                    title="刷新数据"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            )}
            <button 
                onClick={() => setShowCloudModal(true)}
                className={`text-xs flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-colors
                    ${jsonBinConfig 
                        ? 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100' 
                        : 'text-slate-500 border-slate-200 hover:text-blue-600 hover:border-blue-300 bg-white'}`}
            >
                <Database className="w-3 h-3" />
                {jsonBinConfig ? '已连接' : '设置数据源'}
            </button>
         </div>

         {/* Connection Error Banner */}
         {(cloudError || cloudStatus === 'error') && (
             <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
                 <AlertCircle className="w-4 h-4 shrink-0" />
                 <span>无法连接到服务器，请检查网络或刷新。</span>
                 <button onClick={handleRefresh} className="underline font-medium ml-auto">重试</button>
             </div>
         )}

         <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-blue-600 p-6 text-white text-center">
              <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Users className="w-8 h-8" />
                请选择你的分组
              </h2>
              <p className="text-blue-100 mt-2 text-sm">第一步：找到你所在的队伍</p>
            </div>
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {groups.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 flex flex-col items-center gap-4">
                   {jsonBinConfig ? (
                       <>
                           {cloudStatus === 'syncing' || isRefreshing ? (
                               <RefreshCw className="w-10 h-10 animate-spin text-blue-500" />
                           ) : (
                               <div className="bg-slate-50 p-4 rounded-full">
                                  <WifiOff className="w-8 h-8 text-slate-300" />
                               </div>
                           )}
                           
                           <div>
                               <p className="font-medium text-slate-600">
                                   {cloudStatus === 'syncing' ? '正在同步数据...' : '暂无分组数据'}
                               </p>
                               <p className="text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                                   已连接到云端。请等待老师更新名单，或点击上方刷新按钮。
                               </p>
                           </div>
                           <button 
                               onClick={handleRefresh}
                               className="mt-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                           >
                               手动刷新
                           </button>
                       </>
                   ) : (
                       <>
                           <div className="bg-slate-50 p-4 rounded-full">
                              <Database className="w-8 h-8 text-slate-300" />
                           </div>
                           <div>
                               <p className="font-medium text-slate-600">未连接到数据库</p>
                               <p className="text-xs mt-1">请扫描老师的二维码，或点击右上角设置。</p>
                           </div>
                       </>
                   )}
                </div>
              ) : (
                groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className="flex items-center justify-between p-6 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all group text-left"
                  >
                    <span className="font-bold text-lg text-slate-700 group-hover:text-blue-700">{group.name}</span>
                    <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
                  </button>
                ))
              )}
            </div>
         </div>

         {/* Leaderboard Section */}
         <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  <h3 className="font-bold text-lg">本周学习时长排行榜 (Top 10)</h3>
              </div>
              <div className="p-0">
                  {top10.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                          暂无数据，快来成为第一个打卡的吧！
                      </div>
                  ) : (
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 text-slate-500 font-medium">
                                  <tr>
                                      <th className="px-4 py-3 w-16 text-center">排名</th>
                                      <th className="px-4 py-3">姓名</th>
                                      <th className="px-4 py-3">队伍</th>
                                      <th className="px-4 py-3 text-right">时长</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {top10.map((stat, index) => (
                                      <tr key={stat.studentId} className="hover:bg-slate-50">
                                          <td className="px-4 py-3 text-center font-bold text-slate-600">
                                              {index === 0 && <Medal className="w-5 h-5 text-yellow-500 mx-auto" />}
                                              {index === 1 && <Medal className="w-5 h-5 text-slate-400 mx-auto" />}
                                              {index === 2 && <Medal className="w-5 h-5 text-amber-700 mx-auto" />}
                                              {index > 2 && <span>{index + 1}</span>}
                                          </td>
                                          <td className="px-4 py-3 font-medium text-slate-800">{stat.studentName}</td>
                                          <td className="px-4 py-3 text-slate-500">{stat.teamNumber}</td>
                                          <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">
                                              {formatDuration(stat.totalDurationMs)}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
         </div>
      </div>
    );
  }

  // Render Students Selection
  if (!selectedStudentId) {
    const groupName = groups.find(g => g.id === selectedGroupId)?.name;
    const groupStudents = students.filter(s => s.groupId === selectedGroupId);

    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
         <button onClick={() => setSelectedGroupId(null)} className="mb-4 flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> 返回分组列表
         </button>
         <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="w-8 h-8" />
                  {groupName}
                </h2>
                <p className="text-indigo-100 mt-1 text-sm">第二步：点击你的名字</p>
              </div>
              <div className="text-indigo-200 text-sm bg-indigo-700/50 px-3 py-1 rounded-full">
                 {groupStudents.length} 位成员
              </div>
            </div>
            <div className="p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {groupStudents.length === 0 ? (
                <div className="col-span-full text-center py-10 text-slate-400">
                   <p>该分组下暂无学生。</p>
                </div>
              ) : (
                groupStudents.map(student => {
                   const isWorking = activeSessions.some(s => s.studentId === student.id);
                   return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`relative p-4 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-2 min-h-[120px]
                        ${isWorking 
                          ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' 
                          : 'bg-white border-slate-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md'}`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                        ${isWorking ? 'bg-amber-200 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-700">{student.name}</span>
                      {isWorking && (
                        <span className="absolute top-2 right-2 w-3 h-3 bg-amber-500 rounded-full animate-pulse border-2 border-white"></span>
                      )}
                    </button>
                   );
                })
              )}
            </div>
         </div>
      </div>
    );
  }

  // Render Action (Start/Stop)
  const currentStudent = students.find(s => s.id === selectedStudentId);
  
  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <button onClick={() => setSelectedStudentId(null)} className="mb-4 flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> 返回成员列表
      </button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-slate-800 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">
            你好, {currentStudent?.name}
          </h2>
          <p className="text-slate-300 mt-2 text-sm">请确认操作</p>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
              {error}
            </div>
          )}
          
          {successMsg && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center border border-green-100 animate-fade-in">
              <p className="font-bold text-lg">{successMsg}</p>
              {aiQuote && (
                <div className="mt-2 text-sm italic text-green-800 bg-green-100/50 p-2 rounded">
                  "AI: {aiQuote}"
                </div>
              )}
              <button onClick={resetSelection} className="mt-4 text-sm underline text-green-700 hover:text-green-900">
                返回首页
              </button>
            </div>
          )}

          {!successMsg && (
            <div className="pt-2">
              {!activeSession ? (
                <button
                  onClick={handleStart}
                  className="w-full py-6 rounded-xl font-bold text-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30"
                >
                  <CheckCircle className="w-8 h-8" />
                  开始打卡 (Start)
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl text-center">
                    <p className="text-amber-800 font-medium text-lg">正在学习中...</p>
                    <p className="text-amber-600 mt-1">
                       开始时间: {new Date(activeSession.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={handleEnd}
                    disabled={loading}
                    className="w-full py-6 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-red-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {loading ? (
                       <span className="animate-pulse">处理中...</span>
                    ) : (
                      <>
                        <StopCircle className="w-8 h-8" />
                        结束打卡 (End)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCheckIn;
