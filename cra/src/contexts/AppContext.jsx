import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  saveUserData, 
  loadUserData, 
  saveFolders, 
  loadFolders, 
  saveCreations, 
  loadCreations 
} from '../services/api';
import {
  mapTypeToMetadataCategory,
  generateCreationRightsId
} from '../services/metadataExtraction';

// Sample data - used as fallback or initial data
const initialFolders = [
  
];

// Create context
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState('creator');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI state
  // Initialize activeView from localStorage if available
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

  // Save activeView to localStorage whenever it changes
  useEffect(() => {
    if (activeView && isAuthenticated) {
      localStorage.setItem('activeView', activeView);
    }
  }, [activeView, isAuthenticated]);
  

  // Load authentication state from localStorage
  useEffect(() => {
    const loadAuthState = async () => {
      setIsLoading(true);
      
      try {
        const savedAuth = localStorage.getItem('authState');
        
        if (savedAuth) {
          const authState = JSON.parse(savedAuth);
          
          // Check if auth state is valid and has the user's email
          if (authState.isAuthenticated && authState.currentUser && authState.currentUser.email) {
            setIsAuthenticated(true);
            setUserType(authState.userType || 'creator');
            setCurrentUser(authState.currentUser);
            
            console.log(`Found authenticated user: ${authState.currentUser.email}`);
            
            // First ensure user folder structure by making a diagnostic call
            try {
              const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
              const sanitizedUserId = authState.currentUser.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
              
              const diagnosticResponse = await fetch(`${API_URL}/api/users/${sanitizedUserId}/diagnostics/folders`);
              if (diagnosticResponse.ok) {
                const diagnosticData = await diagnosticResponse.json();
                console.log('Folder structure diagnostic:', diagnosticData);
                
                // If any folder or file was fixed, we should reload data
                if (diagnosticData.attempted_fix) {
                  console.log('Folder structure was fixed, reloading data...');
                }
              }
            } catch (diagnosticError) {
              console.error('Error running folder structure diagnostic:', diagnosticError);
              // Continue anyway to try loading data
            }
            
            // Load data for this specific user from server only
            await loadUserDataFromServer(authState.currentUser.email);
          } else {
            // Not authenticated, clear activeView
            setActiveView('dashboard');
            localStorage.removeItem('activeView');
          }
        } else {
          // Not authenticated, clear activeView
          setActiveView('dashboard');
          localStorage.removeItem('activeView');
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem('authState');
        // Reset to dashboard on error
        setActiveView('dashboard');
        localStorage.removeItem('activeView');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAuthState();
  }, []);

  // Load user data from server
  const loadUserDataFromServer = async (userEmail) => {
    try {
      setIsLoading(true);
      console.log(`Loading data for user: ${userEmail}`);
      
      // Clear existing data first to prevent mixing
      setFolders([]);
      setCreations([]);
      
      // Try to load folders from server only
      const userFolders = await loadFolders(userEmail);
      if (userFolders && userFolders.length > 0) {
        console.log(`Loaded ${userFolders.length} folders for user ${userEmail}`);
        setFolders(userFolders);
      }
      // Try to load creations from server only
      const userCreations = await loadCreations(userEmail);
      if (userCreations && userCreations.length > 0) {
        console.log(`Loaded ${userCreations.length} creations for user ${userEmail}`);
        setCreations(userCreations);
      }
    } catch (error) {
      console.error('Error loading user data from server:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save folders when they change
  useEffect(() => {
    const syncFolders = async () => {
      if (isAuthenticated && currentUser && currentUser.email && folders.length > 0) {
        // Save folders only to server
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
        // Save creations only to server
        saveCreations(currentUser.email, creations).catch(err => {
          console.error('Error saving creations to server:', err);
        });
      }
    };
    
    syncCreations();
  }, [creations, isAuthenticated, currentUser]);

  // Actions
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Instead of hardcoded user types, use the email to identify the user
      const userEmail = loginCredentials.email.trim().toLowerCase();
      
      if (!userEmail) {
        throw new Error('Email is required');
      }
      
      // Create a basic user object based on the email (only used if no existing profile is found)
      const basicUser = {
        id: userEmail, // Use email as ID for simplicity
        email: userEmail,
        name: userEmail.split('@')[0], // Simple name from email
        type: loginCredentials.accountType
      };
      
      // Clear any existing data
      setFolders([]);
      setCreations([]);
      setCurrentFolder(null);
      setBreadcrumbs([]);
      
      // First, check if user data already exists on the server
      try {
        console.log(`Checking if user profile exists for ${userEmail}`);
        const existingUserData = await loadUserData(userEmail);
        
        if (existingUserData) {
          console.log('Existing user profile found:', existingUserData);
          
          // Use the existing user data instead of the basic user object
          setCurrentUser(existingUserData);
          setUserType(existingUserData.type || existingUserData.userType || loginCredentials.accountType);
          
          // Save auth state to localStorage with the complete user data
          const authState = {
            isAuthenticated: true,
            userType: existingUserData.type || existingUserData.userType || loginCredentials.accountType,
            currentUser: existingUserData,
            timestamp: new Date().getTime()
          };
          localStorage.setItem('authState', JSON.stringify(authState));
          
          // No need to save user data, as it already exists
        } else {
          console.log('No existing user profile found. Creating new profile.');
          
          // Set user info with basic data
          setCurrentUser(basicUser);
          setUserType(loginCredentials.accountType);
          
          // Save auth state to localStorage with basic user data
          const authState = {
            isAuthenticated: true,
            userType: loginCredentials.accountType,
            currentUser: basicUser,
            timestamp: new Date().getTime()
          };
          localStorage.setItem('authState', JSON.stringify(authState));
          
          // Save basic user data to server only for new users
          await saveUserData(userEmail, basicUser);
        }
      } catch (error) {
        console.error('Error checking for existing user profile:', error);
        
        // Fallback to basic user creation as before
        setCurrentUser(basicUser);
        setUserType(loginCredentials.accountType);
        
        // Save auth state to localStorage
        const authState = {
          isAuthenticated: true,
          userType: loginCredentials.accountType,
          currentUser: basicUser,
          timestamp: new Date().getTime()
        };
        localStorage.setItem('authState', JSON.stringify(authState));
        
        // Attempt to save user data
        await saveUserData(userEmail, basicUser);
      }
      
      // Set authentication state
      setIsAuthenticated(true);
      
      // Load user data from server based on email
      await loadUserDataFromServer(userEmail);
      
      setShowLoginModal(false);
      setActiveView('dashboard');
    } catch (error) {
      console.error('Login error:', error);
      alert('Error during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear all user data
    setCreations([]);
    setFolders([]);
    setCurrentFolder(null);
    setBreadcrumbs([]);
    
    // Clear authentication state
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowLoginModal(false);
    
    // Reset view to dashboard and clear from localStorage
    setActiveView('dashboard');
    localStorage.removeItem('activeView');
    
    // Clear auth state from localStorage
    localStorage.removeItem('authState');
  };
  
  const updateUserProfile = async (updatedUserData) => {
    setIsLoading(true);
    
    try {
      // Make sure we're using persistent URLs for photos, not object URLs
      // Replace temporary object URLs with persistent ones from Cloud Storage
      if (updatedUserData.photoUrl && updatedUserData.photoUrl.startsWith('blob:')) {
        console.warn('Replacing temporary object URL with persisted URL - this should be handled in the component');
      }
      
      // Update the user data in state
      setCurrentUser(updatedUserData);
      
      // Update auth state in localStorage
      const authState = {
        isAuthenticated: true,
        userType: userType,
        currentUser: updatedUserData,
        timestamp: new Date().getTime()
      };
      localStorage.setItem('authState', JSON.stringify(authState));
      
      // Save to server (if using an API)
      if (updatedUserData.email) {
        await saveUserData(updatedUserData.email, updatedUserData);
        console.log('Profile updated successfully on server');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
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

  const removeTag = (tagToRemove) => {
    setCurrentCreation({
      ...currentCreation,
      tags: currentCreation.tags.filter(tag => tag !== tagToRemove)
    });
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


  
  // Add this debug function to help trace the creation lifecycle in AppContext.jsx
  const debugCreation = (operation, creation) => {
    const debugInfo = {
      operation,
      id: creation.id,
      title: creation.title,
      type: creation.type,
      hasMetadata: !!creation.metadata,
      creationRightsId: creation.metadata?.creationRightsId || 'none',
      fileUrl: creation.fileUrl || creation.gcsUrl || 'none',
      timestamp: new Date().toISOString()
    };
    
    console.log(`[CreationDebug] ${operation}:`, debugInfo);
  };
  
  // Add a function to verify creations data consistency in AppContext.jsx
  const verifyCreationsConsistency = async () => {
    if (!currentUser?.email) return;
    
    try {
      console.log('Verifying creations data consistency...');
      
      // Fetch creations from server
      const serverCreations = await loadCreations(currentUser.email);
      
      // Compare with local state
      const localCreationsCount = creations.length;
      const serverCreationsCount = serverCreations.length;
      
      console.log(`Local creations: ${localCreationsCount}, Server creations: ${serverCreationsCount}`);
      
      if (localCreationsCount !== serverCreationsCount) {
        console.warn('Creations count mismatch! Synchronizing from server...');
        setCreations(serverCreations);
      } else {
        // Check for metadata consistency
        let inconsistencies = 0;
        
        for (const localCreation of creations) {
          const serverCreation = serverCreations.find(c => c.id === localCreation.id);
          if (!serverCreation) {
            console.warn(`Creation ${localCreation.id} exists locally but not on server`);
            inconsistencies++;
            continue;
          }
          
          // Check for essential fields
          if (!localCreation.metadata && serverCreation.metadata) {
            console.warn(`Creation ${localCreation.id} has metadata on server but not locally`);
            inconsistencies++;
          } else if (localCreation.metadata && !serverCreation.metadata) {
            console.warn(`Creation ${localCreation.id} has metadata locally but not on server`);
            inconsistencies++;
          }
          
          // Check file URLs
          if (localCreation.fileUrl !== serverCreation.fileUrl) {
            console.warn(`Creation ${localCreation.id} has different fileUrl`);
            inconsistencies++;
          }
        }
        
        if (inconsistencies > 0) {
          console.warn(`Found ${inconsistencies} inconsistencies. Synchronizing from server...`);
          setCreations(serverCreations);
        } else {
          console.log('Creations are consistent between client and server');
        }
      }
    } catch (error) {
      console.error('Error verifying creations consistency:', error);
    }
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
      handleLogout,
      handleInputChange,
      handleLoginInput,
      handleTagInput,
      removeTag,
      resetForm,
      handleSubmit,  // The unified submit function
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
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the context
export const useAppContext = () => useContext(AppContext);