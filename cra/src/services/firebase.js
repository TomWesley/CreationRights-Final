// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';

// Your Firebase configuration
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
const auth = getAuth(app);
const db = getFirestore(app);

// Auth functions
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const createUserWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// User profile functions
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Function to get all users (for ArtistsList)
export const getAllUsers = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
};

// Chat functions - using Firestore for chat data
export const createChat = async (participants) => {
  try {
    // Create a new chat document with a generated ID
    const chatId = `chat_${Date.now()}`;
    const chatRef = doc(db, "chats", chatId);
    
    const chatData = {
      id: chatId,
      participants,
      created: new Date().toISOString(),
      lastMessage: '',
      lastMessageTime: null,
      messages: []
    };
    
    await setDoc(chatRef, chatData);
    
    return chatData;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
};

export const getUserChats = async (userEmail) => {
  try {
    const chatsCollection = collection(db, 'chats');
    // Query chats where this user is a participant
    const q = query(chatsCollection, where("participants", "array-contains", { email: userEmail }));
    const chatsSnapshot = await getDocs(q);
    
    return chatsSnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error getting user chats:", error);
    throw error;
  }
};

export { auth, db };