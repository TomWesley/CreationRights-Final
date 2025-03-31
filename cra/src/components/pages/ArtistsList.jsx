// src/components/pages/ArtistsList.jsx - Simplified version
import React, { useState, useEffect } from 'react';
import { Search, Filter, User, Sort, ChevronDown, Mail, ExternalLink, Star, MessageSquare, BookmarkPlus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAppContext } from '../../contexts/AppContext';

const ArtistsList = () => {
  const { isLoading, setIsLoading } = useAppContext();
  const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
  // State for artists data
  const [artists, setArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch artists data
  useEffect(() => {
    const fetchArtists = async () => {
      setIsLoading(true);
      console.log("foo")
      try {
        const response = await fetch(`${API_URL}/api/users`)
        if (!response.ok) {
          throw new Error(`Failed to fetch artists: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Transform the data to fit our component's needs
        const transformedData = data.map(user => ({
          id: user.id || user.email,
          name: user.name || (user.email ? user.email.split('@')[0] : 'Unknown'),
          email: user.email || 'No email provided',
          bio: user.bio || 'No bio available',
          website: user.website || '',
          location: user.location || 'Unknown location',
          specialties: user.specialties || ['Content Creator'],
          joinedDate: user.createdAt || new Date().toISOString(),
          publicCreations: 0, // Default value as we're not calculating this now
          featured: Math.random() > 0.7, // Randomly mark some as featured for demo
          photoUrl: user.photoUrl || '',
          status: user.status || 'active'
        }));
        
        setArtists(transformedData);
        setFilteredArtists(transformedData);
      } catch (err) {
        console.error('Error fetching artists:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtists();
  }, [setIsLoading]);
  
  // Extract all unique specialties for filter dropdown
  const allSpecialties = [...new Set(artists.flatMap(artist => artist.specialties))].sort();
  
  // Apply filtering and sorting
  useEffect(() => {
    let filtered = [...artists];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(artist => 
        artist.name.toLowerCase().includes(query) ||
        (artist.bio && artist.bio.toLowerCase().includes(query)) ||
        (artist.location && artist.location.toLowerCase().includes(query)) ||
        artist.email.toLowerCase().includes(query) ||
        (artist.specialties && artist.specialties.some(specialty => 
          specialty.toLowerCase().includes(query)
        ))
      );
    }
    
    // Apply specialty filter
    if (specialtyFilter) {
      filtered = filtered.filter(artist => 
        artist.specialties && artist.specialties.some(specialty => 
          specialty.toLowerCase() === specialtyFilter.toLowerCase()
        )
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
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
    
    setFilteredArtists(filtered);
  }, [artists, searchQuery, specialtyFilter, sortField, sortDirection]);
  
  // Toggle sort direction
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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
      ) : error ? (
        <div className="text-center py-8 bg-red-50 rounded-lg p-6">
          <User className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Artists</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : filteredArtists.length === 0 ? (
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
          {filteredArtists.map(artist => (
            <Card key={artist.id} className={artist.featured ? 'border-2 border-blue-500' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center">
                    {artist.name}
                    {artist.featured && (
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
                  <p className="text-gray-700">{artist.bio}</p>
                  
                  <div className="text-gray-500">
                    <p className="flex items-center text-xs">
                      <Mail className="h-3 w-3 mr-1" />
                      {artist.email}
                    </p>
                    {artist.website && (
                      <p className="flex items-center text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        <a href={artist.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {artist.website.replace(/(^\w+:|^)\/\//, '')}
                        </a>
                      </p>
                    )}
                    {artist.location && (
                      <p className="text-xs mt-1">Location: {artist.location}</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Specialties:</p>
                    <div className="flex flex-wrap gap-1">
                      {artist.specialties.map(specialty => (
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
                    <span>Joined: {new Date(artist.joinedDate).toLocaleDateString()}</span>
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