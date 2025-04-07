// src/components/pages/AllCreationsList.jsx

import React, { useState, useEffect } from 'react';
import { Search, Filter, Globe, LucideSortAsc, User, Calendar, Tag } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import CreationCard from '../shared/CreationCard';
import { useAppContext } from '../../contexts/AppContext';
import mockCreations from '../../data/mockCreations'; // Import mockCreations directly

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
  
  // Load mock data on component mount
  useEffect(() => {
    setIsLoading(true);
    
    try {
      // Check localStorage for any saved changes to the mock data
      const savedCreations = localStorage.getItem('mockCreations');
      
      if (savedCreations) {
        setCreations(JSON.parse(savedCreations));
      } else {
        // Use the imported mock data
        setCreations(mockCreations);
        localStorage.setItem('mockCreations', JSON.stringify(mockCreations));
      }
    } catch (error) {
      console.error('Error loading mock data:', error);
      // Fallback to imported mock data
      setCreations(mockCreations);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);
  
  // Filter and sort creations
  useEffect(() => {
    if (!Array.isArray(creations)) {
      console.error('Creations is not an array:', creations);
      setFilteredCreations([]);
      return;
    }
    
    // Filter published creations only
    let filtered = creations.filter(creation => creation.status === 'published');
    
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
  
  // Reset mock data for testing
  const resetMockData = () => {
    setCreations(mockCreations);
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
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Creations Found</h3>
              <p className="text-gray-500">
                {searchQuery || tagFilter || creatorFilter 
                  ? 'Try adjusting your search or filters' 
                  : 'No published creations available at this time'}
              </p>
              
              {/* Debug button - you can remove this in production */}
              <Button
                variant="outline"
                size="sm"
                onClick={resetMockData}
                className="mt-4"
              >
                Reset Demo Data
              </Button>
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
          These creations are publicly shared by creators on our platform. 
          Contact creators directly to inquire about licensing or collaboration opportunities.
        </p>
      </div>
    </div>
  );
};

export default AllCreationsList;