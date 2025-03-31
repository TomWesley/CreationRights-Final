// src/components/pages/ArtistsList.jsx

import React, { useState, useEffect } from 'react';
import { Search, Filter, User, Sort, ChevronDown, Mail, ExternalLink, Star, MessageSquare, BookmarkPlus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAppContext } from '../../contexts/AppContext';

const ArtistsList = () => {
  const { isLoading, setIsLoading } = useAppContext();
  
  // Sample creators data - would be fetched from API in real implementation
  const [creators, setCreators] = useState([
    {
      id: 'creator1',
      name: 'Michael Rodriguez',
      email: 'michael@creationrights.com',
      bio: 'Photographer and visual artist specializing in street photography and urban landscapes.',
      website: 'https://michaelrodriguez.com',
      location: 'New York, NY',
      specialties: ['Photography', 'Visual Art'],
      joinedDate: '2023-10-15',
      publicCreations: 12,
      featured: true
    },
    {
      id: 'creator2',
      name: 'Sarah Chen',
      email: 'sarah@creationrights.com',
      bio: 'Writer and poet focusing on modern life narratives and cultural identity.',
      website: 'https://sarahchen.com',
      location: 'San Francisco, CA',
      specialties: ['Writing', 'Poetry'],
      joinedDate: '2023-11-20',
      publicCreations: 8,
      featured: false
    },
    {
      id: 'creator3',
      name: 'James Wilson',
      email: 'james@creationrights.com',
      bio: 'Audio producer and sound designer with experience in film and interactive media.',
      website: 'https://jameswilson.audio',
      location: 'Los Angeles, CA',
      specialties: ['Audio', 'Sound Design', 'Music'],
      joinedDate: '2024-01-05',
      publicCreations: 15,
      featured: true
    },
    {
      id: 'creator4',
      name: 'Elena Martinez',
      email: 'elena@creationrights.com',
      bio: 'Digital artist and animator creating immersive experiences and interactive installations.',
      website: 'https://elenamartinez.art',
      location: 'Chicago, IL',
      specialties: ['Digital Art', 'Animation'],
      joinedDate: '2024-02-10',
      publicCreations: 6,
      featured: false
    },
    {
      id: 'creator5',
      name: 'David Kim',
      email: 'david@creationrights.com',
      bio: 'Filmmaker and documentary producer focusing on social and environmental issues.',
      website: 'https://davidkim.media',
      location: 'Austin, TX',
      specialties: ['Film', 'Documentary'],
      joinedDate: '2023-12-18',
      publicCreations: 10,
      featured: true
    }
  ]);
  
  // State for filtered creators
  const [filteredCreators, setFilteredCreators] = useState(creators);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [sortField, setSortField] = useState('joinedDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Extract all unique specialties for filter dropdown
  const allSpecialties = [...new Set(creators.flatMap(creator => creator.specialties))].sort();
  
  // Apply filtering and sorting
  useEffect(() => {
    let filtered = [...creators];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(creator => 
        creator.name.toLowerCase().includes(query) ||
        creator.bio.toLowerCase().includes(query) ||
        creator.location.toLowerCase().includes(query) ||
        creator.email.toLowerCase().includes(query) ||
        creator.specialties.some(specialty => specialty.toLowerCase().includes(query))
      );
    }
    
    // Apply specialty filter
    if (specialtyFilter) {
      filtered = filtered.filter(creator => 
        creator.specialties.some(specialty => 
          specialty.toLowerCase() === specialtyFilter.toLowerCase()
        )
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'joinedDate':
          aValue = new Date(a.joinedDate);
          bValue = new Date(b.joinedDate);
          break;
        case 'publicCreations':
          aValue = a.publicCreations;
          bValue = b.publicCreations;
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredCreators(filtered);
  }, [creators, searchQuery, specialtyFilter, sortField, sortDirection]);
  
  // Toggle sort direction
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  return (
    <div className="artists-view">
      <div className="artists-header mb-4">
        <div>
          <h1 className="text-2xl font-bold">Artists & Creators</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse all creators on the platform to find collaboration opportunities
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="search-container flex-1">
            <Search className="h-4 w-4 text-gray-500 absolute mt-3 ml-2" />
            <Input
              placeholder="Search artists by name, specialty, location..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)} 
            className="filter-button"
          >
            <Filter className="h-4 w-4 mr-2" /> Filters
          </Button>
        </div>
      </div>
      
      {/* Filters and sorting */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Specialty</label>
                <select 
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                >
                  <option value="">All Specialties</option>
                  {allSpecialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Sort By</label>
                <div className="flex gap-2">
                  <Button 
                    variant={sortField === 'name' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="flex items-center"
                  >
                    Name {sortField === 'name' && (
                      sortDirection === 'asc' ? '↑' : '↓'
                    )}
                  </Button>
                  
                  <Button 
                    variant={sortField === 'joinedDate' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleSort('joinedDate')}
                    className="flex items-center"
                  >
                    Date Joined {sortField === 'joinedDate' && (
                      sortDirection === 'asc' ? '↑' : '↓'
                    )}
                  </Button>
                  
                  <Button 
                    variant={sortField === 'publicCreations' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleSort('publicCreations')}
                    className="flex items-center"
                  >
                    Creations {sortField === 'publicCreations' && (
                      sortDirection === 'asc' ? '↑' : '↓'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Artist cards */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading artists...</p>
        </div>
      ) : filteredCreators.length === 0 ? (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Artists Found</h3>
          <p className="text-gray-500">
            {searchQuery || specialtyFilter 
              ? 'Try adjusting your search or filters' 
              : 'No artists available at this time'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map(creator => (
            <Card key={creator.id} className={creator.featured ? 'border-2 border-blue-500' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center">
                    {creator.name}
                    {creator.featured && (
                      <Star className="h-4 w-4 text-blue-500 ml-1" fill="currentColor" />
                    )}
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <BookmarkPlus className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="text-sm space-y-2">
                  <p className="text-gray-700">{creator.bio}</p>
                  
                  <div className="text-gray-500">
                    <p className="flex items-center text-xs">
                      <Mail className="h-3 w-3 mr-1" />
                      {creator.email}
                    </p>
                    {creator.website && (
                      <p className="flex items-center text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        <a href={creator.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {creator.website.replace(/(^\w+:|^)\/\//, '')}
                        </a>
                      </p>
                    )}
                    {creator.location && (
                      <p className="text-xs mt-1">Location: {creator.location}</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Specialties:</p>
                    <div className="flex flex-wrap gap-1">
                      {creator.specialties.map(specialty => (
                        <span 
                          key={specialty} 
                          className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 pt-2">
                    <span>Joined: {new Date(creator.joinedDate).toLocaleDateString()}</span>
                    <span>{creator.publicCreations} public works</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 flex justify-between">
                <Button variant="ghost" size="sm" className="text-blue-600 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Message
                </Button>
                <Button variant="outline" size="sm">
                  View Portfolio
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-700 mb-2">About Featured Artists</h3>
        <p className="text-sm text-blue-600">
          Artists marked with a star are featured creators with a strong portfolio and proven track record.
          We recommend prioritizing these artists for collaborations and licensing opportunities.
        </p>
      </div>
    </div>
  );
};

export default ArtistsList;