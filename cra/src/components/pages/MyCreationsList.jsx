// src/components/pages/MyCreationsList.jsx

import React, { useState, useEffect } from 'react';
import { Search, Plus, Cloud } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import CreationCard from '../shared/CreationCard';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../ui/use-toast';

const MyCreationsList = () => {
  const { 
    activeTab,
    setActiveTab,
    isLoading,
    setIsLoading,
    currentUser,
    setActiveView,
    creations,
    handleDelete,
    handleUpdateCreation,
    loadUserData
  } = useAppContext();
  
  const { toast } = useToast();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCreations, setFilteredCreations] = useState([]);
  
  // Load data on component mount
  useEffect(() => {
    const loadCreations = async () => {
      setIsLoading(true);
      
      try {
        if (currentUser && currentUser.uid) {
          await loadUserData(currentUser.uid);
        } else {
          console.error('Cannot load creations: No authenticated user');
          toast({
            title: "Authentication required",
            description: "Please log in to view your creations",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading creations:', error);
        toast({
          title: "Error",
          description: "Failed to load your creations",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCreations();
    // Empty dependency array to run only once on mount
  }, []);
  
  // Filter creations based on tab and search query
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
    setIsLoading(true);
    
    try {
      if (currentUser && currentUser.uid) {
        await loadUserData(currentUser.uid);
        
        toast({
          title: "Refreshed",
          description: "Your creations have been refreshed",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error refreshing creations:', error);
      toast({
        title: "Error",
        description: "Failed to refresh creations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="creations-view">
      <div className="creations-header">
        <div>
          <h1 className="creations-title">
            My Creations
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
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading creations...</p>
            </div>
          ) : filteredCreations.length === 0 ? (
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
                >
                  Refresh Creations
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