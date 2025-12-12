
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCz1shzJdH9gr0-QHkiZxLG4RTp2PV6Ajc",
  authDomain: "brg-inventory-manager-d5da5.firebaseapp.com",
  projectId: "brg-inventory-manager-d5da5",
  storageBucket: "brg-inventory-manager-d5da5.firebasestorage.app",
  messagingSenderId: "1054675777628",
  appId: "1:1054675777628:web:27b56a70fedf11ea7e4e99",
  measurementId: "G-WY1Q80LEPY"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// FIX: To resolve the error "experimentalForceLongPolling and experimentalAutoDetectLongPolling cannot be used together",
// we must ensure one is explicitly false if the other is true.
export const db = firebase.firestore(app);
db.settings({ 
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false
});

// Database Helper Functions
export const fetchCollection = async (collectionName: string) => {
  try {
    const querySnapshot = await db.collection(collectionName).get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    throw error;
  }
};

export const addToCollection = async (collectionName: string, data: any) => {
  try {
    const docRef = await db.collection(collectionName).add(data);
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error(`Error adding to ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const docRef = db.collection(collectionName).doc(docId);
    await docRef.update(data);
  } catch (error) {
    console.error(`Error updating document ${docId} in ${collectionName}:`, error);
    throw error;
  }
};

export const setDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const docRef = db.collection(collectionName).doc(docId);
    await docRef.set(data, { merge: true });
  } catch (error) {
    console.error(`Error setting document ${docId} in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = db.collection(collectionName).doc(docId);
    await docRef.delete();
  } catch (error) {
    console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
    throw error;
  }
};
