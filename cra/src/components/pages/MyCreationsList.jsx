// src/components/pages/MyCreationsList.jsx - Fixed re-rendering issues

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Cloud, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import CreationCard from '../shared/CreationCard';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../ui/use-toast';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit
} from 'firebase/firestore';
import { db } from '../../services/firebase';

// Store loaded data in a module-level variable to persist between unmounts
let cachedCreations = [];
let dataLoaded = false;
let currentUserId = null;

const MyCreationsList = () => {
  console.log("MyCreationsList: Component rendering");
  
  const { 
    activeTab,
    setActiveTab,
    setIsLoading,
    currentUser,
    setActiveView,
    handleDelete,
    handleUpdateCreation
  } = useAppContext();
  
  const { toast } = useToast();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [creations, setCreations] = useState(cachedCreations);
  const [filteredCreations, setFilteredCreations] = useState([]);
  const [dataFetching, setDataFetching] = useState(false);
  
  // Track if component is mounted
  const isMounted = useRef(true);
  const dataFetchRequested = useRef(false);
  
  // Set up mount/unmount tracking
  useEffect(() => {
    console.log("MyCreationsList: Component mounted");
    isMounted.current = true;
    dataFetchRequested.current = false;
    
    // Turn off global loading immediately
    setIsLoading(false);
    
    return () => {
      console.log("MyCreationsList: Component unmounting");
      isMounted.current = false;
      dataFetchRequested.current = false;
    };
  }, [setIsLoading]);
  
  // Load data in the background - with better conditions to prevent re-renders
  useEffect(() => {
    // Skip if already fetching, already loaded for this user, or request already made
    if (
      dataFetching || 
      dataFetchRequested.current || 
      (dataLoaded && currentUserId === currentUser?.uid)
    ) {
      return;
    }
    
    // Skip if we don't have a user yet
    if (!currentUser || !currentUser.uid) {
      console.log("MyCreationsList: No user available yet");
      return;
    }
    
    // Mark that we've requested data fetch for this render cycle
    dataFetchRequested.current = true;
    
    const loadCreations = async () => {
      console.log(`MyCreationsList: Background loading data for ${currentUser.uid}`);
      setDataFetching(true);
      
      try {
        // Fetch creations directly from Firebase
        const creationsRef = collection(db, 'users', currentUser.uid, 'creations');
        const creationsQuery = query(
          creationsRef, 
          orderBy('dateCreated', 'desc'),
          limit(50)
        );
        
        const snapshot = await getDocs(creationsQuery);
        
        const userCreations = [];
        snapshot.forEach(doc => {
          userCreations.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`MyCreationsList: Loaded ${userCreations.length} creations for ${currentUser.uid}`);
        
        // Update cache variables
        cachedCreations = userCreations;
        dataLoaded = true;
        currentUserId = currentUser.uid;
        
        // Update state if still mounted
        if (isMounted.current) {
          setCreations(userCreations);
        }
      } catch (error) {
        console.error('MyCreationsList: Error fetching creations:', error);
      } finally {
        if (isMounted.current) {
          setDataFetching(false);
        }
      }
    };
    
    // Start loading data
    loadCreations();
  }, [currentUser, dataFetching]);
  
  // Filter creations based on tab and search query - with memo to reduce calculations
  useEffect(() => {
    if (!Array.isArray(creations)) {
      console.error('Creations is not an array:', creations);
      setFilteredCreations([]);
      return;
    }
    
    let filtered = [...creations];
    
    // Filter by type (tab)
    if (activeTab !== 'all') {
      filtered = filtered.filter(creation => 
        creation.type && creation.type.toLowerCase() === activeTab.toLowerCase()
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
          tag && tag.toLowerCase().includes(query)
        ))
      );
    }
    
    setFilteredCreations(filtered);
  }, [creations, activeTab, searchQuery]);
  
  // Handle toggling publish status
  const handleTogglePublish = (creation) => {
    const updatedCreation = {
      ...creation,
      status: creation.status === 'published' ? 'draft' : 'published'
    };
    
    handleUpdateCreation(updatedCreation);
    
    toast({
      title: updatedCreation.status === 'published' ? "Creation published" : "Creation unpublished",
      description: `${creation.title} is now ${updatedCreation.status === 'published' ? 'visible to agencies' : 'in draft mode'}`,
      variant: "default"
    });
  };
  
  // Handle delete creation
  const handleDeleteCreation = (id) => {
    handleDelete(id);
    
    toast({
      title: "Creation deleted",
      description: "The creation has been permanently removed",
      variant: "default"
    });
  };
  
  // Handle edit creation
  const handleEditCreation = (creation) => {
    // For now, display a toast until edit functionality is implemented
    toast({
      title: "Edit not available",
      description: "Edit functionality will be implemented soon",
      variant: "default"
    });
  };
  
  // Navigate to upload creation page
  const navigateToUpload = () => {
    setActiveView('uploadCreation');
  };
  
  // Refresh creations data
  const refreshCreations = async () => {
    if (!currentUser || !currentUser.uid) {
      console.log("Cannot refresh: No user available");
      return;
    }
    
    setDataFetching(true);
    dataLoaded = false; // Force reload
    
    try {
      // Fetch creations directly from Firebase
      const creationsRef = collection(db, 'users', currentUser.uid, 'creations');
      const creationsQuery = query(
        creationsRef, 
        orderBy('dateCreated', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(creationsQuery);
      
      const userCreations = [];
      snapshot.forEach(doc => {
        userCreations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Update both cache and state
      cachedCreations = userCreations;
      dataLoaded = true;
      currentUserId = currentUser.uid;
      
      if (isMounted.current) {
        setCreations(userCreations);
        
        toast({
          title: "Refreshed",
          description: "Your creations have been refreshed",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('MyCreationsList: Error refreshing creations:', error);
      
      if (isMounted.current) {
        toast({
          title: "Error",
          description: "Failed to refresh creations",
          variant: "destructive"
        });
      }
    } finally {
      if (isMounted.current) {
        setDataFetching(false);
      }
    }
  };
  
  return (
    <div className="creations-view">
      <div className="creations-header">
        <div>
          <h1 className="creations-title">
            Library
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and organize all your creative works
          </p>
        </div>
        
        <div className="creations-actions flex space-x-2">
          <div className="search-container">
            <Search className="search-icon" />
            <Input
              placeholder="Search creations..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button 
            variant="default" 
            className="upload-button"
            onClick={navigateToUpload}
          >
            <Plus className="button-icon-small mr-1" /> Upload Creation
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="tabs-header">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="music">Music</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="software">Software</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {/* Background fetching indicator */}
          {dataFetching && (
            <div className="flex justify-end">
              <div className="text-xs text-blue-500 flex items-center">
                <Loader2 className="animate-spin h-3 w-3 mr-1" />
                Fetching data...
              </div>
            </div>
          )}
          
          {filteredCreations.length === 0 ? (
            <div className="text-center py-8">
              <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Creations Found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by uploading your first creation'}
              </p>
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={navigateToUpload}
                >
                  <Plus className="h-4 w-4 mr-2" /> Upload Creation
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshCreations}
                  className="mt-2"
                  disabled={dataFetching}
                >
                  {dataFetching ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Refreshing...
                    </>
                  ) : 'Refresh Creations'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="creation-list">
              {filteredCreations.map(creation => (
                <CreationCard 
                  key={creation.id} 
                  creation={creation} 
                  handleEdit={() => handleEditCreation(creation)}
                  handleDelete={() => handleDeleteCreation(creation.id)}
                  handleTogglePublish={() => handleTogglePublish(creation)}
                  isAgencyView={false}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium mb-2 text-blue-700">Tips for Managing Your Creations</h3>
        <p className="text-sm text-blue-600">
          Publishing your creations makes them visible to agencies and others on the platform.
          Make sure to include detailed metadata for better discoverability.
        </p>
      </div>
    </div>
  );
};

export default MyCreationsList;