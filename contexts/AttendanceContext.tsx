import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AttendanceSession, AggregatedStats, Group, RegisteredStudent, FirebaseConfig } from '../types';
import { initFirebase, getFirebaseConfigFromLocal, arrayToObject, objectToArray } from '../services/firebaseService';
import { ref, onValue, set as firebaseSet, update } from "firebase/database";

interface AttendanceContextType {
  sessions: AttendanceSession[];
  activeSessions: AttendanceSession[];
  groups: Group[];
  students: RegisteredStudent[];
  isCloudMode: boolean;
  
  // Actions
  addGroup: (name: string) => void;
  removeGroup: (id: string) => void;
  addStudent: (name: string, groupId: string) => void;
  removeStudent: (id: string) => void;
  
  clockIn: (studentId: string) => void;
  clockOut: (studentId: string) => Promise<string>;
  resetData: () => void;
  getAggregatedStats: () => AggregatedStats[];
  
  // Cloud specific
  connectCloud: (config: FirebaseConfig) => Promise<void>;
  disconnectCloud: () => void;
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
  const [isCloudMode, setIsCloudMode] = useState(false);
  const [dbInstance, setDbInstance] = useState<any>(null);

  // Initial Load Logic
  useEffect(() => {
    const cloudConfig = getFirebaseConfigFromLocal();
    
    if (cloudConfig) {
      // Try to connect to cloud
      try {
        const db = initFirebase(cloudConfig);
        setDbInstance(db);
        setIsCloudMode(true);
      } catch (e) {
        console.error("Failed to auto-connect to cloud, falling back to local", e);
        loadLocalData();
      }
    } else {
      // No cloud config, load local
      loadLocalData();
    }
  }, []);

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

  // --- Firebase Listeners (Read) ---
  useEffect(() => {
    if (isCloudMode && dbInstance) {
      const dataRef = ref(dbInstance, '/');
      
      const unsubscribe = onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setSessions(objectToArray<AttendanceSession>(data.sessions));
          setGroups(objectToArray<Group>(data.groups));
          setStudents(objectToArray<RegisteredStudent>(data.students));
        } else {
          // Empty DB
          setSessions([]);
          setGroups([]);
          setStudents([]);
        }
      });

      return () => unsubscribe();
    }
  }, [isCloudMode, dbInstance]);

  // --- Local Storage Sync (Write - only if NOT cloud mode) ---
  useEffect(() => {
    if (!isCloudMode) {
      localStorage.setItem('eduTrackerSessions', JSON.stringify(sessions));
    }
  }, [sessions, isCloudMode]);

  useEffect(() => {
    if (!isCloudMode) {
      localStorage.setItem('eduTrackerGroups', JSON.stringify(groups));
    }
  }, [groups, isCloudMode]);

  useEffect(() => {
    if (!isCloudMode) {
      localStorage.setItem('eduTrackerStudents', JSON.stringify(students));
    }
  }, [students, isCloudMode]);

  const activeSessions = sessions.filter(s => s.endTime === null);

  // --- Helper: Write Data ---
  const saveData = (path: string, data: any) => {
    if (isCloudMode && dbInstance) {
       // Firebase Write
       // We need to write objects keyed by ID for easier updates, 
       // but our state is Array.
       // So we just update the specific node if possible, or overwrite the list.
       // For simplicity in this hybrid approach, we will set the specific item path.
       if (Array.isArray(data)) {
          // If we are replacing a whole list (like resetData), careful.
          // Ideally we use update or set on parent.
          const obj = arrayToObject(data);
          firebaseSet(ref(dbInstance, path), obj);
       } else {
          // Single item update/add
          firebaseSet(ref(dbInstance, `${path}/${data.id}`), data);
       }
    } else {
       // Local State Update is handled by the specific action functions calling setX
    }
  };
  
  const removeData = (path: string, id: string) => {
      if (isCloudMode && dbInstance) {
          firebaseSet(ref(dbInstance, `${path}/${id}`), null);
      }
  }

  // --- Management Actions ---

  const addGroup = useCallback((name: string) => {
    if (!name.trim()) return;
    const newGroup: Group = { id: Date.now().toString(), name: name.trim() };
    
    if (isCloudMode) {
        saveData('groups', newGroup);
    } else {
        setGroups(prev => [...prev, newGroup]);
    }
  }, [isCloudMode, dbInstance]);

  const removeGroup = useCallback((id: string) => {
    if (isCloudMode) {
        removeData('groups', id);
        // Also need to remove students in this group for consistency, 
        // but let's just remove the group for now or do a complex update.
        // For simplicity in this prompt:
        const studentsToRemove = students.filter(s => s.groupId === id);
        studentsToRemove.forEach(s => removeData('students', s.id));
    } else {
        setGroups(prev => prev.filter(g => g.id !== id));
        setStudents(prev => prev.filter(s => s.groupId !== id));
    }
  }, [isCloudMode, dbInstance, students]);

  const addStudent = useCallback((name: string, groupId: string) => {
    if (!name.trim()) return;
    const newStudent: RegisteredStudent = { 
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), 
      name: name.trim(), 
      groupId 
    };
    
    if (isCloudMode) {
        saveData('students', newStudent);
    } else {
        setStudents(prev => [...prev, newStudent]);
    }
  }, [isCloudMode, dbInstance]);

  const removeStudent = useCallback((id: string) => {
    if (isCloudMode) {
        removeData('students', id);
    } else {
        setStudents(prev => prev.filter(s => s.id !== id));
    }
  }, [isCloudMode, dbInstance]);

  // --- Attendance Actions ---

  const clockIn = useCallback((studentId: string) => {
    const student = students.find(s => s.id === studentId);
    const group = groups.find(g => g.id === student?.groupId);

    if (!student || !group) {
      throw new Error("学生或分组信息无效。");
    }
    
    // Check if already active
    const isAlreadyActive = activeSessions.some(s => s.studentId === studentId);
    if (isAlreadyActive) {
      throw new Error("该学生已在打卡中，请先结束之前的会话。");
    }

    const newSession: AttendanceSession = {
      id: Date.now().toString(),
      studentId: student.id,
      studentName: student.name,
      teamNumber: group.name, // Snapshot group name as team number
      startTime: Date.now(),
      endTime: null,
    };

    if (isCloudMode) {
        saveData('sessions', newSession);
    } else {
        setSessions(prev => [...prev, newSession]);
    }
  }, [activeSessions, students, groups, isCloudMode, dbInstance]);

  const clockOut = useCallback(async (studentId: string): Promise<string> => {
    const session = sessions.find(s => s.studentId === studentId && s.endTime === null);

    if (!session) {
      throw new Error("找不到该学生的活跃打卡记录。");
    }

    const updatedSession = {
        ...session,
        endTime: Date.now()
    };
    
    if (isCloudMode) {
        saveData('sessions', updatedSession);
    } else {
        setSessions(prev => prev.map(s => s.id === session.id ? updatedSession : s));
    }
    
    return session.studentId; 
  }, [sessions, isCloudMode, dbInstance]);

  const resetData = useCallback(() => {
    if(window.confirm("确定要清除所有打卡记录吗？分组和名单将保留。")) {
        if (isCloudMode) {
            firebaseSet(ref(dbInstance, 'sessions'), null);
        } else {
            setSessions([]);
        }
    }
  }, [isCloudMode, dbInstance]);

  const connectCloud = async (config: FirebaseConfig) => {
      const db = initFirebase(config);
      setDbInstance(db);
      
      // Migration: Upload local data to cloud if cloud is empty? 
      // Or just overwrite cloud with local? 
      // Let's overwrite cloud with local for initial sync to ensure consistency.
      // Warning: This might overwrite existing cloud data if multiple people try to init.
      // Safer: Just upload what we have.
      
      const rootRef = ref(db, '/');
      const snapshot = await new Promise<any>(resolve => onValue(rootRef, resolve, { onlyOnce: true }));
      
      if (!snapshot.exists()) {
          // Only upload local data if cloud is empty
          await firebaseSet(rootRef, {
              groups: arrayToObject(groups),
              students: arrayToObject(students),
              sessions: arrayToObject(sessions)
          });
      }
      
      setIsCloudMode(true);
  };

  const disconnectCloud = useCallback(() => {
      setIsCloudMode(false);
      setDbInstance(null);
      // Reload will handle clearing the config from memory/service logic best
      window.location.reload();
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
      const duration = session.endTime 
        ? session.endTime - session.startTime 
        : Date.now() - session.startTime; 
      
      stat.totalDurationMs += duration;
      stat.sessionCount += 1;
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalDurationMs - a.totalDurationMs);
  }, [sessions, students, groups]);

  return (
    <AttendanceContext.Provider value={{ 
      sessions, 
      activeSessions, 
      groups, 
      students,
      isCloudMode,
      addGroup,
      removeGroup,
      addStudent,
      removeStudent,
      clockIn, 
      clockOut, 
      resetData, 
      getAggregatedStats, 
      connectCloud,
      disconnectCloud
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};
