// src/contexts/AppContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  saveUserData, 
  loadUserData, 
  saveFolders, 
  loadFolders, 
  saveCreations, 
  loadCreations 
} from '../services/api';

// Sample data - used as fallback or initial data
const initialFolders = [
  { id: 'f1', name: 'Images', parentId: null },
  { id: 'f2', name: 'Written Works', parentId: null },
  { id: 'f3', name: 'Music', parentId: null },
  { id: 'f4', name: 'Photography', parentId: 'f1' },
  { id: 'f5', name: 'Illustrations', parentId: 'f1' },
  { id: 'f6', name: 'Short Stories', parentId: 'f2' },
  { id: 'f7', name: 'Blog Posts', parentId: 'f2' },
];

// const sampleCreations = [
//   {
//     id: 'c1',
//     title: 'Mountain Landscape',
//     type: 'Image',
//     dateCreated: '2023-04-15',
//     rights: 'All rights reserved, Copyright 2023',
//     notes: 'Shot in Colorado during summer trip',
//     folderId: 'f4',
//     tags: ['nature', 'landscape']
//   },
//   {
//     id: 'c2',
//     title: 'Character Concept Art',
//     type: 'Image',
//     dateCreated: '2023-05-22',
//     rights: 'Creative Commons Attribution',
//     notes: 'Fantasy character design for personal project',
//     folderId: 'f5',
//     tags: ['fantasy', 'character']
//   },
//   {
//     id: 'c3',
//     title: 'The Lost Path',
//     type: 'Text',
//     dateCreated: '2023-03-10',
//     rights: 'Copyright 2023, pending publication',
//     notes: 'Short story for anthology submission',
//     folderId: 'f6',
//     tags: ['fiction', 'horror']
//   },
//   {
//     id: 'c4',
//     title: 'Summer Melody',
//     type: 'Music',
//     dateCreated: '2023-06-05',
//     rights: 'All rights reserved, registered with ASCAP',
//     notes: 'Acoustic guitar composition',
//     folderId: 'f3',
//     tags: ['acoustic', 'instrumental']
//   }
// ];

// Create context
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState('creator');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI state
  const [activeView, setActiveView] = useState('dashboard');
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
            
            // Load data for this specific user from server only
            await loadUserDataFromServer(authState.currentUser.email);
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem('authState');
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
      } else {
        // If no folders on server, save initial ones
        console.log(`No folders found, initializing for user ${userEmail}`);
        await saveFolders(userEmail, initialFolders);
        setFolders(initialFolders);
      }
      
      // Try to load creations from server only
      const userCreations = await loadCreations(userEmail);
      if (userCreations && userCreations.length > 0) {
        console.log(`Loaded ${userCreations.length} creations for user ${userEmail}`);
        setCreations(userCreations);
      } else {
        // If no creations on server, save initial ones
        // console.log(`No creations found, initializing for user ${userEmail}`);
        // await saveCreations(userEmail, sampleCreations);
        // setCreations(sampleCreations);
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
      
      // Create a user object based on the email
      const user = {
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
      
      // Set user info
      setCurrentUser(user);
      setUserType(loginCredentials.accountType);
      setIsAuthenticated(true);
      
      // Save auth state to localStorage (only authentication info)
      const authState = {
        isAuthenticated: true,
        userType: loginCredentials.accountType,
        currentUser: user,
        timestamp: new Date().getTime() // Add timestamp for potential session expiry
      };
      localStorage.setItem('authState', JSON.stringify(authState));
      
      // Save user data to server
      await saveUserData(userEmail, user);
      
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
    
    // Clear auth state from localStorage
    localStorage.removeItem('authState');
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

  const resetForm = () => {
    setCurrentCreation({
      id: '',
      title: '',
      type: '',
      dateCreated: '',
      rights: '',
      notes: '',
      folderId: currentFolder ? currentFolder.id : '',
      tags: [],
    });
    setEditMode(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!currentCreation.title || !currentCreation.type) {
        alert('Title and type are required fields');
        setIsLoading(false);
        return;
      }
      
      let updatedCreations;
      
      if (editMode) {
        // Update existing creation
        updatedCreations = creations.map(creation => 
          creation.id === currentCreation.id ? {
            ...currentCreation,
            // Remove the temporary _fileObject if it exists
            _fileObject: undefined 
          } : creation
        );
      } else {
        // Add new creation with unique ID
        const newCreation = {
          ...currentCreation,
          id: `c${Date.now()}`,
          dateCreated: currentCreation.dateCreated || new Date().toISOString().split('T')[0],
          folderId: currentCreation.folderId || (currentFolder ? currentFolder.id : ''),
          // Add user identifier to the creation
          createdBy: currentUser.email,
          createdAt: new Date().toISOString()
        };
        
        // If the creation has a file object, handle it
        if (newCreation._fileObject) {
          // In a full implementation, you would upload the file to a server here
          // For now, we just create a persistent object URL and store file metadata
          const persistentUrl = URL.createObjectURL(newCreation._fileObject);
          
          // Update the creation with file information
          newCreation.fileUrl = persistentUrl;
          
          // Remove the temporary file object
          delete newCreation._fileObject;
        }
        
        updatedCreations = [...creations, newCreation];
      }
      
      // Update state
      setCreations(updatedCreations);
      
      // Log for debugging
      console.log(`Saving ${updatedCreations.length} creations for user ${currentUser.email}`);
      
      // Reset form and navigate
      resetForm();
      setActiveView('myCreations');
    } catch (error) {
      console.error('Error saving creation:', error);
      alert('Error saving your creation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (creation) => {
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
      handleSubmit,
      handleEdit,
      handleDelete,
      createFolder,
      deleteFolder,
      toggleFolderExpanded,
      navigateToFolder,
      buildBreadcrumbs,
      getSubFolderIds,
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the context
export const useAppContext = () => useContext(AppContext);