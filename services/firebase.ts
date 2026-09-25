
import { initializeApp } from "firebase/app";
import { 
  getFirestore,
  initializeFirestore, 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-Pf2iKqsTO7kIrpofuRC0yVko8VGZOjI",
  authDomain: "brg-smart-inventory.firebaseapp.com",
  projectId: "brg-smart-inventory",
  storageBucket: "brg-smart-inventory.firebasestorage.app",
  messagingSenderId: "1027406256024",
  appId: "1:1027406256024:web:02e5fc367916da4d65bded",
  measurementId: "G-FPGD0KV7NN"
};

const app = initializeApp(firebaseConfig);

/**
 * Standard Firestore configuration with auto-detect fallback.
 * Allows Firestore to use standard transports while safely negotiating connection.
 */
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch {
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

/**
 * Utility to remove undefined values recursively from an object/array.
 * Circular-reference safe using WeakSet.
 */
const sanitizeData = (data: any, seen = new WeakSet()): any => {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object') return data;
  if (seen.has(data)) return null;
  seen.add(data);

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, seen));
  }

  const sanitized: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value !== undefined) {
        sanitized[key] = sanitizeData(value, seen);
      }
    }
  }
  return sanitized;
};

const extractCleanError = (error: any): Error => {
  const message = (error && typeof error === 'object' && error.message) 
    ? String(error.message) 
    : (typeof error === 'string' ? error : 'Database operation failed');
  const code = (error && typeof error === 'object' && error.code) ? String(error.code) : '';
  const cleanErr = new Error(message);
  if (code) {
    (cleanErr as any).code = code;
  }
  return cleanErr;
};

export const fetchCollection = async (collectionName: string) => {
  try {
    const colRef = collection(db, collectionName);
    const querySnapshot = await getDocs(colRef);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
  } catch (error: any) {
    const cleanErr = extractCleanError(error);
    console.warn(`[Firestore] Fetch ${collectionName} warning:`, cleanErr.message);
    throw cleanErr;
  }
};

export const setDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const sanitized = sanitizeData(data);
    const docRef = doc(db, collectionName, docId);
    return await setDoc(docRef, sanitized, { merge: true });
  } catch (error: any) {
    const cleanErr = extractCleanError(error);
    console.warn(`[Firestore] Set ${docId} warning:`, cleanErr.message);
    throw cleanErr;
  }
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const sanitized = sanitizeData(data);
    const docRef = doc(db, collectionName, docId);
    return await updateDoc(docRef, sanitized);
  } catch (error: any) {
    const cleanErr = extractCleanError(error);
    console.warn(`[Firestore] Update ${docId} warning:`, cleanErr.message);
    throw cleanErr;
  }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    return await deleteDoc(docRef);
  } catch (error: any) {
    const cleanErr = extractCleanError(error);
    console.warn(`[Firestore] Delete ${docId} warning:`, cleanErr.message);
    throw cleanErr;
  }
};

export const getDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error: any) {
    const cleanErr = extractCleanError(error);
    console.warn(`[Firestore] Get ${docId} warning:`, cleanErr.message);
    throw cleanErr;
  }
};
