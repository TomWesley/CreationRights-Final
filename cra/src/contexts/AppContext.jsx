import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db, getUserProfile, updateUserProfile as updateFirebaseUserProfile } from '../services/firebase';

import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

import {
  mapTypeToMetadataCategory,
  generateCreationRightsId
} from '../services/metadataExtraction';
import { saveCreations } from '../services/api';

// Create context
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState('creator');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI state
  const [activeView, setActiveView] = useState(() => {
    const savedView = localStorage.getItem('activeView');
    return savedView || 'dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterFlow, setShowRegisterFlow] = useState(false);

  
  // Content state
  const [creations, setCreations] = useState([]);
  const [currentCreation, setCurrentCreation] = useState({
    id: '',
    title: '',
    type: '',
    dateCreated: '',
    rights: '',
    notes: '',
    tags: [],
    licensingCost: '',
    status: 'draft'
  });
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Login credentials
  const [loginCredentials, setLoginCredentials] = useState({ 
    email: '', 
    password: '', 
    accountType: 'creator' 
  });

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Load user profile data from Firestore
          const userProfile = await getUserProfile(user.uid);
          
          if (userProfile) {
            // Set combined user object with auth and profile data
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              ...userProfile
            });
          } else {
            // User exists in auth but not in Firestore, create basic profile
            const newUserProfile = {
              uid: user.uid,
              email: user.email,
              name: user.displayName || user.email.split('@')[0],
              userType: 'creator',
              createdAt: new Date().toISOString()
            };
            
            // Save to Firestore
            await setDoc(doc(db, 'users', user.uid), newUserProfile);
            
            // Update state
            setCurrentUser(newUserProfile);
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
          
        }
      } else {
        setCurrentUser(null);
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Save activeView to localStorage whenever it changes
  useEffect(() => {
    if (activeView && isAuthenticated) {
      localStorage.setItem('activeView', activeView);
    }
  }, [activeView, isAuthenticated]);

  // Load user data (folders and creations)
  // Load user data from Firestore
const loadUserData = async (email) => {
  try {
    setIsLoading(true);
    console.log(`Loading data for user: ${email}`);
    
    // Ensure we have a current authenticated user before accessing Firestore
    if (!auth.currentUser || !auth.currentUser.uid) {
      console.error('Cannot load user data: No authenticated user');
      setIsLoading(false);
      return;
    }
    
    const userId = auth.currentUser.uid; // Use the UID from auth
    console.log(`Using Firebase UID: ${userId} for loading data`);
    
    // Clear existing data
    setCreations([]);
    
    // Load creations from Firestore
    try {
      const creationsRef = collection(db, 'users', userId, 'creations');
      const creationsQuery = query(creationsRef, orderBy('dateCreated', 'desc'));
      const creationsSnapshot = await getDocs(creationsQuery);
      
      const userCreations = [];
      creationsSnapshot.forEach((doc) => {
        userCreations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`Loaded ${userCreations.length} creations for user ${userId}`);
      setCreations(userCreations);
    } catch (creationsError) {
      console.error('Error loading creations:', creationsError);
      console.error('Error details:', creationsError.code, creationsError.message);
    }
    
    // If no creations found in Firestore, use mock data as fallback during development
    if (creations.length === 0) {
      try {
        const mockCreations = JSON.parse(localStorage.getItem('mockCreations')) || [];
        if (mockCreations.length > 0) {
          console.log('Using mock creations data:', mockCreations.length);
          setCreations(mockCreations);
        }
      } catch (mockError) {
        console.error('Error loading mock data:', mockError);
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  } finally {
    setIsLoading(false);
  }
};


 
  // Auth actions
  const handleLogin = async (e) => {
    e?.preventDefault();
    setIsLoading(true);
    
    
    try {
      // Sign in with Firebase Auth
      await signInWithEmailAndPassword(
        auth, 
        loginCredentials.email,
        loginCredentials.password || 'demopassword123' // For demo, use default password if none provided
      );
      
      // If successful, close the modal
      setShowLoginModal(false);
      
      // Clear form
      setLoginCredentials({
        email: '',
        password: '',
        accountType: 'creator'
      });
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      
      setIsLoading(false);
      return false;
    }
  };

  const handleSignup = async (signupData) => {
    setIsLoading(true);
    
    
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupData.email,
        signupData.password || 'demopassword123' // For demo, use default password if none provided
      );
      
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        email: user.email,
        name: signupData.name || signupData.email.split('@')[0],
        userType: signupData.accountType || 'creator',
        createdAt: new Date().toISOString(),
        status: 'active',
        
        // Social links (if provided)
        socialLinks: signupData.socialLinks || {}
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      // Set current user
      setCurrentUser({
        ...userProfile,
        uid: user.uid
      });
      
      // Close the register flow modal
      setShowRegisterFlow(false);
      
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Signup error:', err);
      setIsLoading(false);
      return false;
    }
  };
  

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateUserProfile = async (profileData) => {
    if (!currentUser || !currentUser.uid) {
      throw new Error('User must be logged in to update profile');
    }
    
    try {
      // Update Firestore
      await updateFirebaseUserProfile(currentUser.uid, profileData);
      
      // Update local state
      setCurrentUser(prev => ({
        ...prev,
        ...profileData
      }));
      
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  // Filter creations based on current folder and search
  const getFilteredCreations = () => {
    let filtered = [...creations];
    
    // Filter by type (tab)
    if (activeTab !== 'all') {
      filtered = filtered.filter(creation => 
        creation.type.toLowerCase() === activeTab.toLowerCase()
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(creation => 
        (creation.title && creation.title.toLowerCase().includes(query)) ||
        (creation.notes && creation.notes.toLowerCase().includes(query)) ||
        (creation.rights && creation.rights.toLowerCase().includes(query)) ||
        (creation.tags && Array.isArray(creation.tags) && creation.tags.some(tag => 
          tag.toLowerCase().includes(query))
        )
      );
    }
    
    return filtered;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCreation({
      ...currentCreation,
      [name]: value
    });
  };

  const handleLoginInput = (e) => {
    const { name, value } = e.target;
    setLoginCredentials((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!currentCreation.tags.includes(newTag)) {
        setCurrentCreation({
          ...currentCreation,
          tags: [...currentCreation.tags, newTag]
        });
      }
      e.target.value = '';
    }
  };

  const resetForm = (preserveMetadata = false) => {
    // If we need to preserve metadata from the current creation
    const currentMetadata = preserveMetadata ? currentCreation.metadata : null;
    
    setCurrentCreation({
      id: '',
      title: '',
      type: '',
      dateCreated: '',
      rights: '',
      notes: '',
      tags: [],
      licensingCost: '',
      status: 'draft',
      // Conditionally include the metadata
      ...(preserveMetadata && { metadata: currentMetadata })
    });
    setEditMode(false);
  };

  // Unified handleSubmit function that handles metadata
  const handleSubmit = async (creation, metadata) => {
    setIsLoading(true);
    console.log('Handling creation submission:', { creation, metadata });
    
    try {
      if (!currentUser || !currentUser.uid) {
        throw new Error('User not authenticated');
      }
      
      // Format licensing cost if provided
      const licensingCost = creation.licensingCost ? parseFloat(creation.licensingCost) : null;
      
      // Make sure we have a creation ID - generate one if needed
      const creationId = creation.id || generateCreationRightsId();
      
      // Make sure we have proper metadata
      const creationWithMetadata = {
        ...creation,
        id: creationId,
        licensingCost,
        metadata: metadata || creation.metadata || {},
        dateCreated: creation.dateCreated || new Date().toISOString().split('T')[0],
        createdBy: currentUser.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: creation.status || 'draft'
      };
      
      console.log('Prepared creation with metadata:', creationWithMetadata);
      
      // Save to Firestore
      try {
        const creationsRef = collection(db, 'users', currentUser.uid, 'creations');
        
        if (editMode) {
          // Update existing document
          const creationRef = doc(db, 'users', currentUser.uid, 'creations', creationId);
          await updateDoc(creationRef, creationWithMetadata);
          console.log(`Updated creation ${creationId} in Firestore`);
        } else {
          // Add new document with custom ID
          await setDoc(doc(db, 'users', currentUser.uid, 'creations', creationId), creationWithMetadata);
          console.log(`Added new creation ${creationId} to Firestore`);
        }
        
        // Update local state
        if (editMode) {
          const updatedCreations = creations.map(c => 
            c.id === creationId ? creationWithMetadata : c
          );
          setCreations(updatedCreations);
        } else {
          setCreations([...creations, creationWithMetadata]);
        }
      } catch (firestoreError) {
        console.error('Error saving to Firestore:', firestoreError);
        
        // Fall back to localStorage for demo/development
        try {
          const existingCreations = JSON.parse(localStorage.getItem('mockCreations')) || [];
          
          let updatedCreations;
          if (editMode) {
            updatedCreations = existingCreations.map(c => 
              c.id === creationId ? creationWithMetadata : c
            );
          } else {
            updatedCreations = [...existingCreations, creationWithMetadata];
          }
          
          localStorage.setItem('mockCreations', JSON.stringify(updatedCreations));
          setCreations(updatedCreations);
          
          console.log('Saved to localStorage as fallback');
        } catch (localStorageError) {
          console.error('Error using localStorage fallback:', localStorageError);
          throw new Error('Failed to save creation data.');
        }
      }
      
      // Reset form and navigate
      resetForm();
      return true;
    } catch (error) {
      console.error('Error saving creation:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (creation) => {
    // Make sure we have a creation with metadata
    if (!creation.metadata) {
      creation.metadata = {
        category: mapTypeToMetadataCategory(creation.type),
        creationRightsId: generateCreationRightsId()
      };
    }
    
    setCurrentCreation(creation);
    setEditMode(true);
    setActiveView('editCreation');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this creation?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!currentUser || !currentUser.uid) {
        throw new Error('User not authenticated');
      }
      
      // Delete from Firestore
      try {
        const creationRef = doc(db, 'users', currentUser.uid, 'creations', id);
        await deleteDoc(creationRef);
        console.log(`Deleted creation ${id} from Firestore`);
      } catch (firestoreError) {
        console.error('Error deleting from Firestore:', firestoreError);
        // Continue to update local state even if Firestore fails
      }
      
      // Update local state
      const updatedCreations = creations.filter(creation => creation.id !== id);
      setCreations(updatedCreations);
      
      // Also update localStorage as fallback
      try {
        const existingCreations = JSON.parse(localStorage.getItem('mockCreations')) || [];
        const updatedMockCreations = existingCreations.filter(creation => creation.id !== id);
        localStorage.setItem('mockCreations', JSON.stringify(updatedMockCreations));
      } catch (localStorageError) {
        console.error('Error updating localStorage:', localStorageError);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting creation:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateCreation = async (updatedCreation) => {
    setIsLoading(true);
    
    try {
      if (!currentUser || !currentUser.uid) {
        throw new Error('User not authenticated');
      }
      
      // Update in Firestore
      try {
        const creationRef = doc(db, 'users', currentUser.uid, 'creations', updatedCreation.id);
        
        // Set updatedAt timestamp
        updatedCreation.updatedAt = new Date().toISOString();
        
        await updateDoc(creationRef, updatedCreation);
        console.log(`Updated creation ${updatedCreation.id} in Firestore`);
      } catch (firestoreError) {
        console.error('Error updating in Firestore:', firestoreError);
        // Continue to update local state even if Firestore fails
      }
      
      // Update state
      const updatedCreations = creations.map(creation => 
        creation.id === updatedCreation.id ? updatedCreation : creation
      );
      
      // Update state
      setCreations(updatedCreations);
      
      // Also update localStorage as fallback
      try {
        const existingCreations = JSON.parse(localStorage.getItem('mockCreations')) || [];
        const updatedMockCreations = existingCreations.map(creation => 
          creation.id === updatedCreation.id ? updatedCreation : creation
        );
        localStorage.setItem('mockCreations', JSON.stringify(updatedMockCreations));
      } catch (localStorageError) {
        console.error('Error updating localStorage:', localStorageError);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating creation:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{
      // State
      isAuthenticated,
      userType,
      currentUser,
      activeView,
      isMobileMenuOpen,
      showLoginModal,
      creations,
      currentCreation,
      editMode,
      activeTab,
      searchQuery,
      loginCredentials,
      isLoading,
      showRegisterFlow,
      
      // Methods
      setIsAuthenticated,
      setUserType,
      setCurrentUser,
      setActiveView,
      setIsMobileMenuOpen,
      setShowLoginModal,
      setShowRegisterFlow,
      setCreations,
      setCurrentCreation,
      setEditMode,
      setActiveTab,
      setSearchQuery,
      setLoginCredentials,
      setIsLoading,
      getFilteredCreations,
      handleLogin,
      handleSignup,
      handleLogout,
      handleInputChange,
      handleLoginInput,
      handleTagInput,
      resetForm,
      handleSubmit,
      handleEdit,
      handleDelete,
      handleUpdateCreation,
      updateUserProfile,
      loadUserData
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the context
export const useAppContext = () => useContext(AppContext);