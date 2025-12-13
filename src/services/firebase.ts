
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// TODO: Replace this object with your actual Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();

// Performance and connection fix for live servers
db.settings({ 
  experimentalForceLongPolling: true
});

export const fetchCollection = async (collectionName: string) => {
  const querySnapshot = await db.collection(collectionName).get();
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const setDocument = async (collectionName: string, docId: string, data: any) => {
  return await db.collection(collectionName).doc(docId).set(data, { merge: true });
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  return await db.collection(collectionName).doc(docId).update(data);
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  return await db.collection(collectionName).doc(docId).delete();
};
