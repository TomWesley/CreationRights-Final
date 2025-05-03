// src/components/pages/AllCreationsList.jsx

import React, { useState, useEffect } from 'react';
import { Search, Filter, Globe, LucideSortAsc, User, Calendar, Tag } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import CreationCard from '../shared/CreationCard';
import { useAppContext } from '../../contexts/AppContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import mockCreations from '../../data/mockCreations'; // Import for fallback

const AllCreationsList = () => {
  const { 
    activeTab,
    setActiveTab,
    isLoading,
    setIsLoading,
    currentUser
  } = useAppContext();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [creations, setCreations] = useState([]);
  const [filteredCreations, setFilteredCreations] = useState([]);
  
  // Sorting and filtering state
  const [sortField, setSortField] = useState('dateCreated');
  const [sortDirection, setSortDirection] = useState('desc');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Load published creations from Firestore on component mount
  useEffect(() => {
    const fetchPublishedCreations = async () => {
      // REMOVED: setIsLoading(true);
      
      try {
        // Make sure we're authenticated before accessing Firestore
        if (!auth.currentUser) {
          console.error('User not authenticated, cannot fetch published creations');
          throw new Error('Authentication required');
        }
        
        const allPublishedCreations = [];
        
        // Get a reference to the users collection
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        // Iterate through all users
        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          
          try {
            // Get this user's creations
            const creationsRef = collection(db, 'users', userId, 'creations');
            
            // Use only orderBy to avoid needing a composite index
            const creationsQuery = query(
              creationsRef, 
              orderBy('dateCreated', 'desc')
            );
            
            const creationsSnapshot = await getDocs(creationsQuery);
            
            // Filter for published status in JavaScript
            creationsSnapshot.forEach(doc => {
              const creationData = doc.data();
              if (creationData.status === 'published') {
                allPublishedCreations.push({
                  id: doc.id,
                  ...creationData,
                  userId: userId // Keep track of which user this belongs to
                });
              }
            });
          } catch (userError) {
            console.error(`Error fetching creations for user ${userId}:`, userError);
            // Continue to next user if one fails
          }
        }
        
        console.log(`Loaded ${allPublishedCreations.length} published creations`);
        setCreations(allPublishedCreations);
      } catch (error) {
        console.error('Error loading published creations:', error);
        
        // As a fallback for development, use mock data
        try {
          console.log('Using mock creations data as fallback');
          // Filter to only include published creations
          const publishedMockCreations = mockCreations.filter(c => c.status === 'published');
          setCreations(publishedMockCreations);
          
          // Also update localStorage for consistency
          localStorage.setItem('mockCreations', JSON.stringify(mockCreations));
        } catch (mockError) {
          console.error('Error using mock data:', mockError);
          setCreations([]);
        }
      } finally {
        // REMOVED: setIsLoading(false);
      }
    };
    
    fetchPublishedCreations();
  }, []);
  
  // Filter and sort creations
  useEffect(() => {
    if (!Array.isArray(creations)) {
      console.error('Creations is not an array:', creations);
      setFilteredCreations([]);
      return;
    }
    
    // Start with all creations (which are already filtered to published only)
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
    
    // Filter by creator
    if (creatorFilter) {
      filtered = filtered.filter(creation => 
        (creation.createdBy && creation.createdBy.toLowerCase().includes(creatorFilter.toLowerCase())) ||
        (creation.metadata && creation.metadata.creator && 
         creation.metadata.creator.toLowerCase().includes(creatorFilter.toLowerCase()))
      );
    }
    
    // Filter by tag
    if (tagFilter) {
      filtered = filtered.filter(creation => 
        creation.tags && Array.isArray(creation.tags) && creation.tags.some(tag => 
          tag && tag.toLowerCase().includes(tagFilter.toLowerCase())
        )
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'dateCreated':
          aValue = new Date(a.dateCreated || 0);
          bValue = new Date(b.dateCreated || 0);
          break;
        case 'creator':
          aValue = a.createdBy || '';
          bValue = b.createdBy || '';
          break;
        default:
          aValue = a[sortField] || '';
          bValue = b[sortField] || '';
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredCreations(filtered);
  }, [creations, activeTab, searchQuery, sortField, sortDirection, creatorFilter, tagFilter]);
  
  // Toggle sort direction when clicking on the same field
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Function to refresh creations data
  const refreshCreations = async () => {
    // REMOVED: setIsLoading(true);
    
    try {
      // Make sure we're authenticated before accessing Firestore
      if (!auth.currentUser) {
        console.error('User not authenticated, cannot fetch published creations');
        throw new Error('Authentication required');
      }
      
      const allPublishedCreations = [];
      
      // Get a reference to the users collection
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      // Iterate through all users
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        
        try {
          // Get this user's creations
          const creationsRef = collection(db, 'users', userId, 'creations');
          
          // Use only orderBy to avoid needing a composite index
          const creationsQuery = query(
            creationsRef, 
            orderBy('dateCreated', 'desc')
          );
          
          const creationsSnapshot = await getDocs(creationsQuery);
          
          // Filter for published status in JavaScript
          creationsSnapshot.forEach(doc => {
            const creationData = doc.data();
            if (creationData.status === 'published') {
              allPublishedCreations.push({
                id: doc.id,
                ...creationData,
                userId: userId // Keep track of which user this belongs to
              });
            }
          });
        } catch (userError) {
          console.error(`Error fetching creations for user ${userId}:`, userError);
          // Continue to next user if one fails
        }
      }
      
      console.log(`Refreshed ${allPublishedCreations.length} published creations`);
      setCreations(allPublishedCreations);
    } catch (error) {
      console.error('Error refreshing published creations:', error);
      
      // If authentication or other error, fall back to mock data
      try {
        console.log('Using mock creations data as fallback');
        // Filter to only include published creations
        const publishedMockCreations = mockCreations.filter(c => c.status === 'published');
        setCreations(publishedMockCreations);
      } catch (mockError) {
        console.error('Error using mock data:', mockError);
      }
    } finally {
      // REMOVED: setIsLoading(false);
    }
  };
  
  // Reset mock data for testing
  const resetMockData = () => {
    setCreations(mockCreations.filter(c => c.status === 'published'));
    localStorage.setItem('mockCreations', JSON.stringify(mockCreations));
    console.log("Mock data reset to original state");
  };
  
  return (
    <div className="creations-view">
      <div className="creations-header">
        <div>
          <h1 className="creations-title">
            All Published Creations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse all published creations from creators on the platform
          </p>
        </div>
        
        <div className="creations-actions">
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
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)} 
            className="filter-button"
          >
            <Filter className="button-icon" /> Filters
          </Button>
        </div>
      </div>
      
      {/* Advanced filters section */}
      {showFilters && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Creator</label>
                <div className="flex">
                  <User className="h-4 w-4 text-gray-500 absolute mt-3 ml-2" />
                  <Input
                    placeholder="Filter by creator..."
                    value={creatorFilter}
                    onChange={(e) => setCreatorFilter(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Tag</label>
                <div className="flex">
                  <Tag className="h-4 w-4 text-gray-500 absolute mt-3 ml-2" />
                  <Input
                    placeholder="Filter by tag..."
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Sort By</label>
                <div className="flex space-x-2">
                  <Button 
                    variant={sortField === 'dateCreated' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleSort('dateCreated')}
                    className="flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Date {sortField === 'dateCreated' && (
                      sortDirection === 'asc' ? '↑' : '↓'
                    )}
                  </Button>
                  
                  <Button 
                    variant={sortField === 'title' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleSort('title')}
                    className="flex items-center"
                  >
                    <LucideSortAsc className="h-4 w-4 mr-1" />
                    Title {sortField === 'title' && (
                      sortDirection === 'asc' ? '↑' : '↓'
                    )}
                  </Button>
                  
                  <Button 
                    variant={sortField === 'creator' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleSort('creator')}
                    className="flex items-center"
                  >
                    <User className="h-4 w-4 mr-1" />
                    Creator {sortField === 'creator' && (
                      sortDirection === 'asc' ? '↑' : '↓'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="tabs-header">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>              
              <TabsTrigger value="video">Video</TabsTrigger>
            
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {/* MODIFIED: Skip the loading check */}
          {filteredCreations.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Creations Found</h3>
              <p className="text-gray-500">
                {searchQuery || tagFilter || creatorFilter 
                  ? 'Try adjusting your search or filters' 
                  : 'No published creations available at this time'}
              </p>
              
              {/* Development tools */}
              <div className="flex flex-col items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshCreations}
                >
                  Refresh Creations
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetMockData}
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
                  isAgencyView={true}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium mb-2 text-blue-700">About Published Creations</h3>
        <p className="text-sm text-blue-600">
          These creations are publicly shared by creators on the platform. 
          Contact creators directly to inquire about licensing or collaboration opportunities.
        </p>
      </div>
    </div>
  );
};

export default AllCreationsList;