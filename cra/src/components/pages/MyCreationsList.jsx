// src/components/pages/MyCreationsList.jsx

import React, { useState, useEffect } from 'react';
import { Search, Plus, Cloud } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import CreationCard from '../shared/CreationCard';
import { useAppContext } from '../../contexts/AppContext';

// Import mockCreations directly
import mockCreationsData from '../../data/mockCreations';

const MyCreationsList = () => {
  const { 
    activeTab,
    setActiveTab,
    isLoading,
    setIsLoading,
    currentUser
  } = useAppContext();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  // Initialize with an empty array to prevent "not iterable" error
  const [creations, setCreations] = useState([]);
  const [filteredCreations, setFilteredCreations] = useState([]);
  
  // Load mock data on component mount
  useEffect(() => {
    console.log("Mock creations data:", mockCreationsData);
    setIsLoading(true);
    
    try {
      if (Array.isArray(mockCreationsData)) {
        console.log("Successfully imported mockCreations as array, length:", mockCreationsData.length);
        setCreations(mockCreationsData);
        localStorage.setItem('mockCreations', JSON.stringify(mockCreationsData));
      } else {
        console.error("mockCreationsData is not an array:", typeof mockCreationsData);
        // If the import didn't return an array, try to check if it has a default property
        if (mockCreationsData && mockCreationsData.default && Array.isArray(mockCreationsData.default)) {
          console.log("Found array in mockCreationsData.default, length:", mockCreationsData.default.length);
          setCreations(mockCreationsData.default);
        } else {
          // Last resort fallback
          console.error("Failed to load mock data in any format");
          setCreations([]);
        }
      }
    } catch (error) {
      console.error('Error loading mock data:', error);
      // Fallback to empty array
      setCreations([]);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);
  
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
    
    // Update creation in local state
    const updatedCreations = creations.map(c => 
      c.id === creation.id ? updatedCreation : c
    );
    
    // Update state and save to localStorage
    setCreations(updatedCreations);
    localStorage.setItem('mockCreations', JSON.stringify(updatedCreations));
  };
  
  // Handle delete creation
  const handleDeleteCreation = (id) => {
    if (window.confirm('Are you sure you want to delete this creation?')) {
      const updatedCreations = creations.filter(creation => creation.id !== id);
      setCreations(updatedCreations);
      localStorage.setItem('mockCreations', JSON.stringify(updatedCreations));
    }
  };
  
  // Handle edit creation (stub for now)
  const handleEditCreation = (creation) => {
    console.log('Edit creation:', creation);
    alert('Edit functionality will be implemented in the future.');
  };
  
  // Reset mock data for testing
  const resetMockData = () => {
    if (Array.isArray(mockCreationsData)) {
      setCreations(mockCreationsData);
      localStorage.setItem('mockCreations', JSON.stringify(mockCreationsData));
      console.log("Mock data reset to original state");
    } else if (mockCreationsData && mockCreationsData.default && Array.isArray(mockCreationsData.default)) {
      setCreations(mockCreationsData.default);
      localStorage.setItem('mockCreations', JSON.stringify(mockCreationsData.default));
      console.log("Mock data reset to original state (from default)");
    } else {
      console.error("Cannot reset mock data - source data is not an array");
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
            onClick={() => {
              // For now, just show a message since upload is not functional yet
              alert('Upload functionality coming soon!');
            }}
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
                  onClick={() => {
                    // For now, just show a message since upload is not functional yet
                    alert('Upload functionality coming soon!');
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Upload Creation
                </Button>
                
                {/* Debug button - you can remove this in production */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetMockData}
                  className="mt-2"
                >
                  Reset Demo Data
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