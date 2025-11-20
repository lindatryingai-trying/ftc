
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AttendanceSession, AggregatedStats, Group, RegisteredStudent, JsonBinConfig, SyncData } from '../types';
import { fetchBinData, updateBinData } from '../services/jsonBinService';

interface AttendanceContextType {
  sessions: AttendanceSession[];
  activeSessions: AttendanceSession[];
  groups: Group[];
  students: RegisteredStudent[];
  
  // Cloud State
  jsonBinConfig: JsonBinConfig | null;
  cloudStatus: 'disconnected' | 'idle' | 'syncing' | 'error';
  cloudError: string | null;
  lastSyncedAt: number | null;
  connectCloud: (binId: string, apiKey: string) => Promise<void>;
  disconnectCloud: () => void;
  refreshData: () => Promise<void>;

  // Actions
  addGroup: (name: string) => void;
  removeGroup: (id: string) => void;
  addStudent: (name: string, groupId: string) => void;
  removeStudent: (id: string) => void;
  
  clockIn: (studentId: string) => void;
  clockOut: (studentId: string) => Promise<string>;
  resetData: () => void;
  getAggregatedStats: () => AggregatedStats[];
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) throw new Error("useAttendance must be used within a AttendanceProvider");
  return context;
};

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<RegisteredStudent[]>([]);

  // Cloud State
  const [jsonBinConfig, setJsonBinConfig] = useState<JsonBinConfig | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'disconnected' | 'idle' | 'syncing' | 'error'>('disconnected');
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  
  const isInitialLoad = useRef(true);
  const lastRemoteUpdateTimestamp = useRef<number>(0);

  // Initial Load Logic
  useEffect(() => {
    loadLocalData();
    
    const storedConfig = localStorage.getItem('eduTrackerJsonBinConfig');
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        setJsonBinConfig(config);
        handleCloudConnection(config, true);
      } catch (e) {
        console.error("Invalid cloud config");
      }
    }
    isInitialLoad.current = false;
  }, []);

  // --- Local Storage Sync (Write) ---
  useEffect(() => {
    localStorage.setItem('eduTrackerSessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('eduTrackerGroups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('eduTrackerStudents', JSON.stringify(students));
  }, [students]);

  // --- Cloud Sync (Auto-Save) ---
  useEffect(() => {
    if (!jsonBinConfig || isInitialLoad.current || cloudStatus === 'error' || cloudStatus === 'disconnected') return;
    
    const timer = setTimeout(() => {
       performCloudSave();
    }, 2000); // Increased debounce slightly

    return () => clearTimeout(timer);
  }, [sessions, groups, students]);

  // --- Cloud Polling (Real-time Simulation) ---
  useEffect(() => {
    // Poll even if error occurred previously, to try and recover
    if (!jsonBinConfig || cloudStatus === 'disconnected') return;

    const pollInterval = setInterval(async () => {
        if (cloudStatus === 'syncing') return;

        try {
            const remoteData = await fetchBinData(jsonBinConfig);
            
            // Robust check for updates
            const remoteTs = remoteData?.updatedAt || 0;
            const localTs = lastRemoteUpdateTimestamp.current;

            // If remote has data and (it's newer OR we have no data locally but remote does)
            if (remoteData && (remoteTs > localTs || (groups.length === 0 && remoteData.groups?.length > 0))) {
                console.log("Polling: New cloud data detected");
                
                lastRemoteUpdateTimestamp.current = remoteTs || Date.now();
                setLastSyncedAt(Date.now());
                setCloudError(null);
                if (cloudStatus === 'error') setCloudStatus('idle');

                if (remoteData.sessions) setSessions(remoteData.sessions);
                if (remoteData.groups) setGroups(remoteData.groups);
                if (remoteData.students) setStudents(remoteData.students);
            }
        } catch (e) {
            // Silent fail on poll to not disrupt UI, just log
            console.warn("Poll failed, retrying in 3s...", e);
        }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [jsonBinConfig, cloudStatus, groups.length]); // Added groups.length dependency to help initial sync

  const loadLocalData = () => {
    try {
      const storedSessions = localStorage.getItem('eduTrackerSessions');
      const storedGroups = localStorage.getItem('eduTrackerGroups');
      const storedStudents = localStorage.getItem('eduTrackerStudents');

      if (storedSessions) setSessions(JSON.parse(storedSessions));
      if (storedGroups) setGroups(JSON.parse(storedGroups));
      if (storedStudents) setStudents(JSON.parse(storedStudents));
    } catch (e) {
      console.error("Failed to parse storage", e);
    }
  };

  // --- Cloud Actions ---

  const handleCloudConnection = async (config: JsonBinConfig, isStartup: boolean = false) => {
    setCloudStatus('syncing');
    setCloudError(null);
    try {
        const remoteData = await fetchBinData(config);
        
        if (remoteData && Array.isArray(remoteData.groups)) {
            console.log("Loaded data from Cloud");
            lastRemoteUpdateTimestamp.current = remoteData.updatedAt || Date.now();
            
            setSessions(remoteData.sessions || []);
            setGroups(remoteData.groups || []);
            setStudents(remoteData.students || []);
            setCloudStatus('idle');
            setLastSyncedAt(Date.now());
        } else {
            console.log("Remote empty/invalid, using local");
            setCloudStatus('idle');
            // If we have local data and remote is empty, push local to remote
            if (!isStartup && groups.length > 0) {
                await performCloudSave(true);
            }
        }
    } catch (e: any) {
        setCloudStatus('error');
        setCloudError(e.message || "连接失败");
        if (!isStartup) throw e;
    }
  };

  const performCloudSave = async (force: boolean = false) => {
    if (!jsonBinConfig) return;
    const now = Date.now();

    setCloudStatus('syncing'); 
    try {
        const payload: SyncData = {
            sessions,
            groups,
            students,
            updatedAt: now
        };

        await updateBinData(jsonBinConfig, payload);
        
        lastRemoteUpdateTimestamp.current = now;
        setCloudStatus('idle');
        setLastSyncedAt(now);
        setCloudError(null);
    } catch (e: any) {
        console.error("Cloud Save Failed", e);
        setCloudStatus('error');
        setCloudError("同步失败，请检查网络");
    }
  };

  const connectCloud = async (binId: string, apiKey: string) => {
      const config = { binId, apiKey };
      await handleCloudConnection(config);
      setJsonBinConfig(config);
      localStorage.setItem('eduTrackerJsonBinConfig', JSON.stringify(config));
  };

  const disconnectCloud = useCallback(() => {
      setJsonBinConfig(null);
      setCloudStatus('disconnected');
      setCloudError(null);
      setLastSyncedAt(null);
      localStorage.removeItem('eduTrackerJsonBinConfig');
  }, []);

  const refreshData = async () => {
      if (jsonBinConfig) {
          await handleCloudConnection(jsonBinConfig);
      }
  };

  // --- Management Actions ---
  const activeSessions = sessions.filter(s => s.endTime === null);

  const addGroup = useCallback((name: string) => {
    if (!name.trim()) return;
    const newGroup: Group = { id: Date.now().toString(), name: name.trim() };
    setGroups(prev => [...prev, newGroup]);
  }, []);

  const removeGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    setStudents(prev => prev.filter(s => s.groupId !== id));
  }, []);

  const addStudent = useCallback((name: string, groupId: string) => {
    if (!name.trim()) return;
    const newStudent: RegisteredStudent = { 
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), 
      name: name.trim(), 
      groupId 
    };
    setStudents(prev => [...prev, newStudent]);
  }, []);

  const removeStudent = useCallback((id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  }, []);

  // --- Attendance Actions ---

  const clockIn = useCallback((studentId: string) => {
    const student = students.find(s => s.id === studentId);
    const group = groups.find(g => g.id === student?.groupId);

    if (!student || !group) throw new Error("学生或分组信息无效。");
    
    const isAlreadyActive = activeSessions.some(s => s.studentId === studentId);
    if (isAlreadyActive) throw new Error("该学生已在打卡中。");

    const newSession: AttendanceSession = {
      id: Date.now().toString(),
      studentId: student.id,
      studentName: student.name,
      teamNumber: group.name, 
      startTime: Date.now(),
      endTime: null,
    };

    setSessions(prev => [...prev, newSession]);
  }, [activeSessions, students, groups]);

  const clockOut = useCallback(async (studentId: string): Promise<string> => {
    const session = sessions.find(s => s.studentId === studentId && s.endTime === null);
    if (!session) throw new Error("找不到该学生的活跃打卡记录。");

    const updatedSession = { ...session, endTime: Date.now() };
    setSessions(prev => prev.map(s => s.id === session.id ? updatedSession : s));
    return session.studentId; 
  }, [sessions]);

  const resetData = useCallback(() => {
    if(window.confirm("确定要清除所有打卡记录吗？分组和名单将保留。")) {
        setSessions([]);
    }
  }, []);

  const getAggregatedStats = useCallback((): AggregatedStats[] => {
    const statsMap = new Map<string, AggregatedStats>();

    students.forEach(student => {
      const group = groups.find(g => g.id === student.groupId);
      statsMap.set(student.id, {
        studentId: student.id,
        studentName: student.name,
        teamNumber: group ? group.name : "未分组",
        totalDurationMs: 0,
        sessionCount: 0,
      });
    });

    sessions.forEach(session => {
      if (!statsMap.has(session.studentId)) {
         statsMap.set(session.studentId, {
            studentId: session.studentId,
            studentName: session.studentName,
            teamNumber: session.teamNumber,
            totalDurationMs: 0,
            sessionCount: 0,
         });
      }
      const stat = statsMap.get(session.studentId)!;
      const duration = session.endTime ? session.endTime - session.startTime : Date.now() - session.startTime; 
      stat.totalDurationMs += duration;
      stat.sessionCount += 1;
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalDurationMs - a.totalDurationMs);
  }, [sessions, students, groups]);

  return (
    <AttendanceContext.Provider value={{ 
      sessions, activeSessions, groups, students,
      jsonBinConfig, cloudStatus, cloudError, lastSyncedAt,
      connectCloud, disconnectCloud, refreshData,
      addGroup, removeGroup, addStudent, removeStudent,
      clockIn, clockOut, resetData, getAggregatedStats
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};
