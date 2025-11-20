
export interface Group {
  id: string;
  name: string;
}

export interface RegisteredStudent {
  id: string;
  name: string;
  groupId: string;
}

export interface AttendanceSession {
  id: string;
  studentId: string; // Links to RegisteredStudent.id
  studentName: string; // Snapshot
  teamNumber: string; // Snapshot (Group Name)
  startTime: number; // Timestamp
  endTime: number | null; // Timestamp, null if currently active
}

export interface AggregatedStats {
  studentId: string;
  studentName: string;
  teamNumber: string;
  totalDurationMs: number;
  sessionCount: number;
}

export interface GeminiAnalysis {
  summary: string;
  topTeam: string;
  recommendations: string;
}

export interface JsonBinConfig {
  binId: string;
  apiKey: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface SyncData {
  sessions: AttendanceSession[];
  groups: Group[];
  students: RegisteredStudent[];
  updatedAt: number;
}
