import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, ref, set, get, Database } from "firebase/database";
import { FirebaseConfig } from "../types";

let app: FirebaseApp | undefined;
let db: Database | undefined;

export const initFirebase = (config: FirebaseConfig) => {
  try {
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    db = getDatabase(app);
    return db;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    throw error;
  }
};

export const getDbInstance = () => db;

export const saveFirebaseConfigToLocal = (config: FirebaseConfig) => {
  localStorage.setItem('eduTrackerFirebaseConfig', JSON.stringify(config));
};

export const getFirebaseConfigFromLocal = (): FirebaseConfig | null => {
  const stored = localStorage.getItem('eduTrackerFirebaseConfig');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem('eduTrackerFirebaseConfig');
  // Force reload to clear memory state
  window.location.reload();
};

// Helper to convert Array to Object (for Firebase storage)
export const arrayToObject = (arr: any[], keyField: string = 'id') => {
  return arr.reduce((acc, item) => {
    acc[item[keyField]] = item;
    return acc;
  }, {});
};

// Helper to convert Object to Array (for App state)
export const objectToArray = <T>(obj: any): T[] => {
  if (!obj) return [];
  return Object.values(obj) as T[];
};
