import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AttendanceSession, AggregatedStats, Group, RegisteredStudent } from '../types';

interface AttendanceContextType {
  sessions: AttendanceSession[];
  activeSessions: AttendanceSession[];
  groups: Group[];
  students: RegisteredStudent[];
  
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

  // Load from local storage on mount
  useEffect(() => {
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
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('eduTrackerSessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('eduTrackerGroups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('eduTrackerStudents', JSON.stringify(students));
  }, [students]);

  const activeSessions = sessions.filter(s => s.endTime === null);

  // --- Management Actions ---

  const addGroup = useCallback((name: string) => {
    if (!name.trim()) return;
    const newGroup: Group = { id: Date.now().toString(), name: name.trim() };
    setGroups(prev => [...prev, newGroup]);
  }, []);

  const removeGroup = useCallback((id: string) => {
    // Remove group and its students
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

    setSessions(prev => [...prev, newSession]);
  }, [activeSessions, students, groups]);

  const clockOut = useCallback(async (studentId: string): Promise<string> => {
    const activeSessionIndex = sessions.findIndex(
      s => s.studentId === studentId && s.endTime === null
    );

    if (activeSessionIndex === -1) {
      throw new Error("找不到该学生的活跃打卡记录。");
    }

    const updatedSessions = [...sessions];
    updatedSessions[activeSessionIndex] = {
        ...updatedSessions[activeSessionIndex],
        endTime: Date.now()
    };
    
    setSessions(updatedSessions);
    return updatedSessions[activeSessionIndex].studentId; 
  }, [sessions]);

  const resetData = useCallback(() => {
    if(window.confirm("确定要清除所有打卡记录吗？分组和名单将保留。")) {
        setSessions([]);
    }
  }, []);

  const getAggregatedStats = useCallback((): AggregatedStats[] => {
    // 1. Create a map for all registered students first (so we show 0 hours students too)
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

    // 2. Iterate sessions and add up time
    sessions.forEach(session => {
      // If student was deleted, we might still want to show them or handle them.
      // For now, let's try to find them in the map. If not found (deleted student), 
      // we can choose to ignore or add a temporary entry. 
      // Let's add them so historical data isn't lost.
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
      addGroup,
      removeGroup,
      addStudent,
      removeStudent,
      clockIn, 
      clockOut, 
      resetData, 
      getAggregatedStats 
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};