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

// আপনার নতুন Firebase কনফিগারেশন
const firebaseConfig = {
  apiKey: "AIzaSyB-Pf2iKqsTO7kIrpofuRC0yVko8VGZOjI",
  authDomain: "brg-smart-inventory.firebaseapp.com",
  projectId: "brg-smart-inventory",
  storageBucket: "brg-smart-inventory.firebasestorage.app",
  messagingSenderId: "1027406256024",
  appId: "1:1027406256024:web:02e5fc367916da4d65bded",
  measurementId: "G-FPGD0KV7NN"
};

// Firebase Initialize করা
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * ডাটাবেস হেল্পার ফাংশনসমূহ (Modular Style)
 */

// ১. পুরো কালেকশন ফেচ করা
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

// ২. নতুন ডকুমেন্ট তৈরি করা বা আপডেট করা (ID সহ)
export const setDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, docId);
    return await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error(`Error setting document ${docId}:`, error);
    throw error;
  }
};

// ৩. বিদ্যমান ডকুমেন্ট আপডেট করা
export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, docId);
    return await updateDoc(docRef, data);
  } catch (error) {
    console.error(`Error updating document ${docId}:`, error);
    throw error;
  }
};

// ৪. ডকুমেন্ট ডিলিট করা
export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    return await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${docId}:`, error);
    throw error;
  }
};
