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
  { id: 'f1', name: 'Images', parentId: null },
  { id: 'f2', name: 'Written Works', parentId: null },
  { id: 'f3', name: 'Music', parentId: null },
  { id: 'f4', name: 'Photography', parentId: 'f1' },
  { id: 'f5', name: 'Illustrations', parentId: 'f1' },
  { id: 'f6', name: 'Short Stories', parentId: 'f2' },
  { id: 'f7', name: 'Blog Posts', parentId: 'f2' },
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
  const handleSubmit = (creation, metadata) => {
    setIsLoading(true);
    
    try {
      // Handle case where creation is event (from form submit)
      if (creation && creation.preventDefault) {
        creation.preventDefault();
        
        // Using currentCreation state with its existing metadata
        if (!currentCreation.title || !currentCreation.type) {
          alert('Title and type are required fields');
          setIsLoading(false);
          return;
        }
        
        let updatedCreations;
        
        if (editMode) {
          // Update existing creation
          updatedCreations = creations.map(c => 
            c.id === currentCreation.id ? {
              ...currentCreation,
              // Ensure metadata is preserved
              metadata: currentCreation.metadata || {},
              // Format licensingCost as number if provided, or null if empty
              licensingCost: currentCreation.licensingCost ? parseFloat(currentCreation.licensingCost) : null,
              // Remove the temporary _fileObject if it exists
              _fileObject: undefined 
            } : c
          );
        } else {
          // Add new creation with unique ID
          const newCreation = {
            ...currentCreation,
            id: `c${Date.now()}`,
            dateCreated: currentCreation.dateCreated || new Date().toISOString().split('T')[0],
            folderId: currentCreation.folderId || (currentFolder ? currentFolder.id : ''),
            // Format licensingCost as number if provided, or null if empty
            licensingCost: currentCreation.licensingCost ? parseFloat(currentCreation.licensingCost) : null,
            // Add status field with default 'draft'
            status: 'draft',
            // IMPORTANT: Ensure metadata is explicitly preserved here
            metadata: currentCreation.metadata || {},
            // Add user identifier to the creation
            createdBy: currentUser.email,
            createdAt: new Date().toISOString()
          };
          
          // If the creation has a file object, handle it
          if (newCreation._fileObject) {
            const persistentUrl = URL.createObjectURL(newCreation._fileObject);
            newCreation.fileUrl = persistentUrl;
            delete newCreation._fileObject;
          }
          
          console.log('Adding new creation with metadata:', JSON.stringify(newCreation.metadata));
          updatedCreations = [...creations, newCreation];
        }
        
        // Update state
        setCreations(updatedCreations);
        
        // Explicitly save to the server
        if (currentUser && currentUser.email) {
          saveCreations(currentUser.email, updatedCreations)
            .then(() => {
              console.log('Successfully saved creations to server');
              resetForm();
              setActiveView('myCreations');
            })
            .catch(err => {
              console.error('Error saving creations:', err);
              alert('Error saving to server. Please try again.');
            });
        } else {
          resetForm();
          setActiveView('myCreations');
        }
      } 
      // Handle case where creation and metadata are passed explicitly
      else {
        // Ensure creation has all required fields
        if (!creation || !creation.title || !creation.type) {
          alert('Title and type are required fields');
          setIsLoading(false);
          return;
        }
        
        // Format licensing cost if provided
        const licensingCost = creation.licensingCost ? parseFloat(creation.licensingCost) : null;
        
        console.log('handleSubmit called with creation:', JSON.stringify(creation));
        console.log('Metadata received:', JSON.stringify(metadata));
        
        // Create a new creation object with metadata
        const creationWithMetadata = {
          ...creation,
          licensingCost,
          metadata: metadata || creation.metadata || {},
          id: creation.id || `c${Date.now()}`,
          dateCreated: creation.dateCreated || new Date().toISOString().split('T')[0],
          folderId: creation.folderId || (currentFolder ? currentFolder.id : ''),
          createdBy: currentUser.email,
          createdAt: new Date().toISOString()
        };
        
        console.log('Submitting creation with metadata:', JSON.stringify(creationWithMetadata));
        
        let updatedCreations;
        
        if (editMode) {
          // Update existing creation
          updatedCreations = creations.map(c => 
            c.id === creationWithMetadata.id ? creationWithMetadata : c
          );
        } else {
          // Add new creation
          updatedCreations = [...creations, creationWithMetadata];
        }
        
        // Update state
        setCreations(updatedCreations);
        
        // Explicitly save to the server
        if (currentUser && currentUser.email) {
          saveCreations(currentUser.email, updatedCreations)
            .then(() => {
              console.log('Successfully saved creations with metadata');
              resetForm();
              setActiveView('myCreations');
            })
            .catch(err => {
              console.error('Error saving creations:', err);
              alert('Error saving your creation. Please try again.');
            });
        } else {
          resetForm();
          setActiveView('myCreations');
        }
      }
    } catch (error) {
      console.error('Error saving creation:', error);
      alert('Error saving your creation. Please try again.');
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