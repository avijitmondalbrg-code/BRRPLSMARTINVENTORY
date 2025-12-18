
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
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
 * Optimized Firestore configuration for high-latency or restricted networks.
 * experimentalForceLongPolling: true - Bypasses WebSockets entirely to avoid handshake timeouts.
 */
export const db = initializeFirestore(app as any, {
  experimentalForceLongPolling: true,
});

/**
 * Utility to remove undefined values recursively from an object/array.
 */
const sanitizeData = (data: any): any => {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const sanitized: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value !== undefined) {
        sanitized[key] = sanitizeData(value);
      }
    }
  }
  return sanitized;
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
    console.error(`Error fetching ${collectionName}:`, error.message || error);
    // Rethrow to allow App.tsx to catch permission-denied
    throw error;
  }
};

export const setDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const sanitized = sanitizeData(data);
    const docRef = doc(db, collectionName, docId);
    return await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    console.error(`Error setting document ${docId}:`, error);
    throw error;
  }
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const sanitized = sanitizeData(data);
    const docRef = doc(db, collectionName, docId);
    return await updateDoc(docRef, sanitized);
  } catch (error) {
    console.error(`Error updating document ${docId}:`, error);
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    return await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${docId}:`, error);
    throw error;
  }
};
