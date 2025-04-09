// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// Replace with your own Firebase config details
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Authentication functions
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const createUserWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Account creation error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  return signOut(auth);
};

// User profile functions
export const getUserProfile = async (uid) => {
  if (!uid) return null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log(`No profile found for user ${uid}`);
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid, profileData) => {
  if (!uid) throw new Error('User ID is required');
  
  try {
    const userRef = doc(db, 'users', uid);
    
    // Check if user document exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing document
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new document
      await setDoc(userRef, {
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Get all users (for user lists)
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Get users by type
export const getUsersByType = async (userType) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('userType', '==', userType));
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      });
    });
    
    return users;
  } catch (error) {
    console.error(`Error getting users of type ${userType}:`, error);
    throw error;
  }
};

// Create a chat
export const createChat = async (participants) => {
  try {
    // Check if chat already exists
    const chatsRef = collection(db, 'chats');
    const querySnapshot = await getDocs(chatsRef);
    
    for (const doc of querySnapshot.docs) {
      const chatData = doc.data();
      
      if (chatData.participants && 
          chatData.participants.length === participants.length &&
          chatData.participants.every(p1 => 
            participants.some(p2 => p2.email === p1.email)
          )) {
        // Chat already exists
        return {
          id: doc.id,
          ...chatData
        };
      }
    }
    
    // Create new chat
    const newChatRef = await addDoc(collection(db, 'chats'), {
      participants,
      participantEmails: participants.map(p => p.email.toLowerCase()),
      participantUIDs: participants.map(p => p.uid).filter(Boolean),
      createdBy: participants[0].uid || participants[0].email,
      createdAt: new Date().toISOString(),
      lastMessage: '',
      lastMessageTime: null
    });
    
    const newChatDoc = await getDoc(newChatRef);
    
    return {
      id: newChatRef.id,
      ...newChatDoc.data()
    };
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

export default app;