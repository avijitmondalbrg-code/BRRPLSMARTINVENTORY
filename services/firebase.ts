import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
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
export const db = getFirestore(app);

/**
 * Utility to remove undefined values recursively from an object/array.
 * Firestore does not support 'undefined' values.
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
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
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