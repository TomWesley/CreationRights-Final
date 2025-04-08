import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  auth, 
  loginWithEmail, 
  createUserWithEmail, 
  logoutUser, 
  getUserProfile,
  updateUserProfile as firebaseUpdateUserProfile
} from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  mapTypeToMetadataCategory,
  generateCreationRightsId
} from '../services/metadataExtraction';
import { loadFolders, loadCreations, saveFolders, saveCreations } from '../services/api';

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
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  
  // Content state
  const [folders, setFolders] = useState([]);
  const [creations, setCreations] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [currentCreation, setCurrentCreation] = useState({
    id: '',
    title: '',
    type: '',
    dateCreated: '',
    rights: '',
    notes: '',
    folderId: '',
    tags: [],
    licensingCost: '',
    status: 'draft'
  });
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  
  // Login credentials
  const [loginCredentials, setLoginCredentials] = useState({ 
    email: '', 
    password: '', 
    accountType: 'creator' 
  });

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      
      if (user) {
        console.log(`User authenticated: ${user.email}`);
        
        try {
          // Fetch user profile from Firestore
          const userProfile = await getUserProfile(user.uid);
          
          if (userProfile) {
            console.log('User profile found:', userProfile);
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              ...userProfile
            });
            setUserType(userProfile.userType || 'creator');
          } else {
            // No profile yet, create minimal one
            console.log('No user profile found, creating minimal profile');
            const minimalProfile = {
              uid: user.uid,
              email: user.email,
              name: user.email.split('@')[0],
              userType: 'creator',
              createdAt: new Date().toISOString()
            };
            setCurrentUser(minimalProfile);
            setUserType('creator');
            
            // Save minimal profile to Firestore
            await firebaseUpdateUserProfile(user.uid, minimalProfile);
          }
          
          // Load user data
          await loadUserData(user.email);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error setting up user profile:', error);
          setIsAuthenticated(false);
        }
      } else {
        console.log('User not authenticated');
        setCurrentUser(null);
        setIsAuthenticated(false);
        
        // Clear data
        setFolders([]);
        setCreations([]);
        setCurrentFolder(null);
        setBreadcrumbs([]);
      }
      
      setIsLoading(false);
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Save activeView to localStorage whenever it changes
  useEffect(() => {
    if (activeView && isAuthenticated) {
      localStorage.setItem('activeView', activeView);
    }
  }, [activeView, isAuthenticated]);

  // Load user data (folders and creations)
  const loadUserData = async (email) => {
    try {
      setIsLoading(true);
      console.log(`Loading data for user: ${email}`);
      
      // Clear existing data first to prevent mixing
      setFolders([]);
      setCreations([]);
      
      // Try to load folders from server
      const userFolders = await loadFolders(email);
      if (userFolders && userFolders.length > 0) {
        console.log(`Loaded ${userFolders.length} folders for user ${email}`);
        setFolders(userFolders);
      }
      
      // Try to load creations from server
      const userCreations = await loadCreations(email);
      if (userCreations && userCreations.length > 0) {
        console.log(`Loaded ${userCreations.length} creations for user ${email}`);
        setCreations(userCreations);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save folders when they change
  useEffect(() => {
    const syncFolders = async () => {
      if (isAuthenticated && currentUser && currentUser.email && folders.length > 0) {
        // Save folders to server
        saveFolders(currentUser.email, folders).catch(err => {
          console.error('Error saving folders to server:', err);
        });
      }
    };
    
    syncFolders();
  }, [folders, isAuthenticated, currentUser]);

  // Save creations when they change
  useEffect(() => {
    const syncCreations = async () => {
      if (isAuthenticated && currentUser && currentUser.email && creations.length > 0) {
        // Save creations to server
        saveCreations(currentUser.email, creations).catch(err => {
          console.error('Error saving creations to server:', err);
        });
      }
    };
    
    syncCreations();
  }, [creations, isAuthenticated, currentUser]);

  // Auth actions
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { email, password, accountType } = loginCredentials;
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Attempt to login with Firebase
      const user = await loginWithEmail(email, password);
      
      // The auth state listener will handle setting up the user
      // but let's ensure the userType is set
      if (user) {
        // Update user profile with accountType if needed
        const profile = await getUserProfile(user.uid);
        if (!profile || profile.userType !== accountType) {
          await firebaseUpdateUserProfile(user.uid, {
            userType: accountType
          });
        }
      }
      
      setShowLoginModal(false);
      setActiveView('dashboard');
    } catch (error) {
      console.error('Login error:', error);
      alert('Error during login. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (signupData) => {
    setIsLoading(true);
    
    try {
      const { email, password, name, accountType } = signupData;
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Create user with Firebase Auth
      const user = await createUserWithEmail(email, password);
      
      // Create user profile in Firestore
      await firebaseUpdateUserProfile(user.uid, {
        email,
        name: name || email.split('@')[0],
        userType: accountType || 'creator',
        createdAt: new Date().toISOString()
      });
      
      // Auth state listener will handle the rest
      setShowLoginModal(false);
      setActiveView('dashboard');
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      alert('Error creating account. ' + error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      
      // Clear all user data
      setCreations([]);
      setFolders([]);
      setCurrentFolder(null);
      setBreadcrumbs([]);
      
      // Reset view to dashboard and clear from localStorage
      setActiveView('dashboard');
      localStorage.removeItem('activeView');
      
      // Auth state listener will handle the rest
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const updateUserProfile = async (updatedUserData) => {
    setIsLoading(true);
    
    try {
      if (!currentUser || !currentUser.uid) {
        throw new Error('User not authenticated');
      }
      
      // Update the Firestore profile
      await firebaseUpdateUserProfile(currentUser.uid, updatedUserData);
      
      // Update local state
      setCurrentUser({
        ...currentUser,
        ...updatedUserData
      });
      
      // Update userType if it changed
      if (updatedUserData.userType && updatedUserData.userType !== userType) {
        setUserType(updatedUserData.userType);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Filter creations based on current folder and search
  const getFilteredCreations = () => {
    let filtered = [...creations];
    
    // Filter by folder
    if (currentFolder) {
      filtered = filtered.filter(creation => creation.folderId === currentFolder.id);
    }
    
    // Filter by type (tab)
    if (activeTab !== 'all') {
      filtered = filtered.filter(creation => 
        creation.type.toLowerCase() === activeTab
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(creation => 
        creation.title.toLowerCase().includes(query) ||
        creation.notes.toLowerCase().includes(query) ||
        creation.rights.toLowerCase().includes(query) ||
        creation.tags.some(tag => tag.toLowerCase().includes(query))
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
    setLoginCredentials({
      ...loginCredentials,
      [name]: value
    });
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
      folderId: currentFolder ? currentFolder.id : '',
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
      // Format licensing cost if provided
      const licensingCost = creation.licensingCost ? parseFloat(creation.licensingCost) : null;
      
      // Make sure we have a creation ID - generate one if needed
      const creationId = creation.id || `c${Date.now()}`;
      
      // Make sure we have proper metadata
      const creationWithMetadata = {
        ...creation,
        id: creationId,
        licensingCost,
        metadata: metadata || creation.metadata || {},
        dateCreated: creation.dateCreated || new Date().toISOString().split('T')[0],
        folderId: creation.folderId || (currentFolder ? currentFolder.id : ''),
        createdBy: currentUser.email,
        createdAt: new Date().toISOString(),
        
        // Default status to draft if not specified
        status: creation.status || 'draft'
      };
      
      console.log('Prepared creation with metadata:', creationWithMetadata);
      
      // First, fetch existing creations to ensure we're not losing any
      let existingCreations = [];
      
      try {
        console.log('Fetching existing creations');
        existingCreations = await loadCreations(currentUser.email);
        console.log(`Loaded ${existingCreations.length} existing creations`);
      } catch (loadError) {
        console.error('Error loading existing creations:', loadError);
        existingCreations = [...creations]; // Fallback to local state
      }
      
      let updatedCreations;
      
      if (editMode) {
        console.log(`Updating existing creation: ${creationId}`);
        // Update existing creation
        updatedCreations = existingCreations.map(c => 
          c.id === creationId ? creationWithMetadata : c
        );
      } else {
        console.log(`Adding new creation: ${creationId}`);
        // Add new creation
        updatedCreations = [...existingCreations, creationWithMetadata];
      }
      
      // Update local state immediately for better UX
      setCreations(updatedCreations);
      
      // Reset form and navigate
      resetForm();
      setActiveView('myCreations');
      return true;
    } catch (error) {
      console.error('Error saving creation:', error);
      alert('Error saving your creation. Please try again.');
      setIsLoading(false);
      return false;
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

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this creation?')) {
      setIsLoading(true);
      
      try {
        const updatedCreations = creations.filter(creation => creation.id !== id);
        setCreations(updatedCreations);
        setIsLoading(false);
      } catch (error) {
        console.error('Error deleting creation:', error);
        alert('Error deleting creation. Please try again.');
        setIsLoading(false);
      }
    }
  };
  
  const handleUpdateCreation = (updatedCreation) => {
    setIsLoading(true);
    
    try {
      const updatedCreations = creations.map(creation => 
        creation.id === updatedCreation.id ? updatedCreation : creation
      );
      
      // Update state
      setCreations(updatedCreations);
      
      // Log for debugging
      console.log(`Updated creation ${updatedCreation.id} status to ${updatedCreation.status}`);
      
      return true;
    } catch (error) {
      console.error('Error updating creation:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createFolder = () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const newFolder = {
        id: `f${Date.now()}`,
        name: newFolderName,
        parentId: currentFolder ? currentFolder.id : null
      };
      
      const updatedFolders = [...folders, newFolder];
      setFolders(updatedFolders);
      
      setNewFolderName('');
      setShowNewFolderModal(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Error creating folder. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFolder = (folderId) => {
    if (window.confirm('Are you sure you want to delete this folder and all contents?')) {
      setIsLoading(true);
      
      try {
        // Remove the folder
        const updatedFolders = folders.filter(folder => folder.id !== folderId);
        
        // Remove all subfolders
        const allSubFolderIds = getSubFolderIds(folderId);
        const foldersAfterSubFolderRemoval = updatedFolders.filter(
          folder => !allSubFolderIds.includes(folder.id)
        );
        
        // Remove creations in those folders
        const updatedCreations = creations.filter(
          creation => creation.folderId !== folderId && !allSubFolderIds.includes(creation.folderId)
        );
        
        setFolders(foldersAfterSubFolderRemoval);
        setCreations(updatedCreations);
        
        // If we deleted the current folder, reset to root
        if (currentFolder && (currentFolder.id === folderId || allSubFolderIds.includes(currentFolder.id))) {
          setCurrentFolder(null);
          setBreadcrumbs([]);
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
        alert('Error deleting folder. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getSubFolderIds = (folderId) => {
    const directChildren = folders.filter(folder => folder.parentId === folderId).map(folder => folder.id);
    let allChildren = [...directChildren];
    
    directChildren.forEach(childId => {
      allChildren = [...allChildren, ...getSubFolderIds(childId)];
    });
    
    return allChildren;
  };

  const toggleFolderExpanded = (folderId) => {
    setExpandedFolders({
      ...expandedFolders,
      [folderId]: !expandedFolders[folderId]
    });
  };

  const navigateToFolder = (folder) => {
    setCurrentFolder(folder);
    
    // Build breadcrumbs
    if (folder === null) {
      setBreadcrumbs([]);
    } else {
      const newBreadcrumbs = buildBreadcrumbs(folder.id);
      setBreadcrumbs(newBreadcrumbs);
    }
    
    setActiveView('myCreations');
  };

  const buildBreadcrumbs = (folderId) => {
    const breadcrumbArray = [];
    let currentId = folderId;
    
    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        breadcrumbArray.unshift(folder);
        currentId = folder.parentId;
      } else {
        currentId = null;
      }
    }
    
    return breadcrumbArray;
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
      showNewFolderModal,
      folders,
      creations,
      currentFolder,
      expandedFolders,
      breadcrumbs,
      currentCreation,
      editMode,
      activeTab,
      searchQuery,
      newFolderName,
      loginCredentials,
      isLoading,
      
      // Methods
      setIsAuthenticated,
      setUserType,
      setCurrentUser,
      setActiveView,
      setIsMobileMenuOpen,
      setShowLoginModal,
      setShowNewFolderModal,
      setFolders,
      setCreations,
      setCurrentFolder,
      setBreadcrumbs,
      setCurrentCreation,
      setEditMode,
      setActiveTab,
      setSearchQuery,
      setNewFolderName,
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
      createFolder,
      deleteFolder,
      toggleFolderExpanded,
      navigateToFolder,
      buildBreadcrumbs,
      getSubFolderIds,
      updateUserProfile,
      loadUserData
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the context
export const useAppContext = () => useContext(AppContext);