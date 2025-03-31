
  // Fetch artists data
 // Updated ArtistsList.jsx component to utilize the enhanced profile data
import React, { useState, useEffect } from 'react';
import { Search, Filter, User, Sort, ChevronDown, Mail, ExternalLink, Star, MessageSquare, BookmarkPlus, Award, MapPin, Calendar, Briefcase, GraduationCap } from 'lucide-react';
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
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch artists data
  // Fetch artists data
  useEffect(() => {
    const fetchArtists = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch(`${API_URL}/api/users`);
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
          contentTypes: user.contentTypes || [],
          joinedDate: user.createdAt || new Date().toISOString(),
          publicCreations: 0, // Default value as we're not calculating this now
          featured: Math.random() > 0.7, // Randomly mark some as featured for demo
          photoUrl: user.photoUrl || '',
          status: user.status || 'active',
          socialLinks: user.socialLinks || {},
          education: user.education || [],
          exhibitions: user.exhibitions || [],
          awards: user.awards || []
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
  
  // Extract all unique specialties and content types for filter dropdowns
  const allSpecialties = [...new Set(artists.flatMap(artist => artist.specialties))].sort();
  const allContentTypes = [...new Set(artists.flatMap(artist => artist.contentTypes))].sort();
  
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
        )) ||
        (artist.contentTypes && artist.contentTypes.some(type => 
          type.toLowerCase().includes(query)
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
    
    // Apply content type filter
    if (contentTypeFilter) {
      filtered = filtered.filter(artist => 
        artist.contentTypes && artist.contentTypes.some(type => 
          type.toLowerCase() === contentTypeFilter.toLowerCase()
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
        case 'location':
          aValue = a.location.toLowerCase();
          bValue = b.location.toLowerCase();
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
  }, [artists, searchQuery, specialtyFilter, contentTypeFilter, sortField, sortDirection]);
  
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Content Type</label>
                <select 
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={contentTypeFilter}
                  onChange={(e) => setContentTypeFilter(e.target.value)}
                >
                  <option value="">All Content Types</option>
                  {allContentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
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
                    variant={sortField === 'location' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleSort('location')}
                    className="flex items-center"
                  >
                    Location {sortField === 'location' && (
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
            {searchQuery || specialtyFilter || contentTypeFilter
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
                <div className="flex gap-4 mb-3">
                  <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {artist.photoUrl ? (
                      <img 
                        src={artist.photoUrl} 
                        alt={artist.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/api/placeholder/80/80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <p className="text-sm text-gray-700">{artist.bio.substring(0, 120)}{artist.bio.length > 120 ? '...' : ''}</p>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      {artist.location && (
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {artist.location}
                        </span>
                      )}
                      
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Joined {new Date(artist.joinedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Content Types & Specialties */}
                <div className="mb-2">
                  {artist.contentTypes && artist.contentTypes.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-700">Content Types:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {artist.contentTypes.map(type => (
                          <span 
                            key={type} 
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {artist.specialties && artist.specialties.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700">Specialties:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {artist.specialties.map(specialty => (
                          <span 
                            key={specialty} 
                            className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Education & Awards */}
                {(artist.education && artist.education.length > 0) || 
                 (artist.awards && artist.awards.length > 0) ? (
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    {artist.education && artist.education.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center text-xs font-medium text-gray-700">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          Education
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {artist.education[0].institution}
                          {artist.education.length > 1 ? ` and ${artist.education.length - 1} more` : ''}
                        </p>
                      </div>
                    )}
                    
                    {artist.awards && artist.awards.length > 0 && (
                      <div>
                        <div className="flex items-center text-xs font-medium text-gray-700">
                          <Award className="h-3 w-3 mr-1" />
                          Awards
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {artist.awards[0].title}
                          {artist.awards.length > 1 ? ` and ${artist.awards.length - 1} more` : ''}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
                
                {/* Contact Information */}
                <div className="text-sm mt-2">
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
                  
                  {/* Social Links */}
                  {artist.socialLinks && Object.keys(artist.socialLinks).length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      {artist.socialLinks.instagram && (
                        <a href={`https://instagram.com/${artist.socialLinks.instagram}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-purple-600 hover:text-purple-800">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.508-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z" />
                          </svg>
                        </a>
                      )}
                      
                      {artist.socialLinks.twitter && (
                        <a href={`https://twitter.com/${artist.socialLinks.twitter}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-blue-400 hover:text-blue-600">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                          </svg>
                        </a>
                      )}
                      
                      {artist.socialLinks.behance && (
                        <a href={artist.socialLinks.behance} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-blue-700 hover:text-blue-900">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.443 5.35c.639 0 1.23.05 1.77.198.513.148.973.33 1.377.644.354.298.639.675.817 1.132.149.462.225.99.225 1.584 0 .693-.149 1.255-.498 1.738-.33.462-.839.874-1.497 1.206.906.264 1.576.783 2.05 1.474.446.692.674 1.529.674 2.533 0 .809-.178 1.529-.48 2.138-.298.593-.717 1.1-1.235 1.474a5.236 5.236 0 0 1-1.771.783c-.658.165-1.347.247-2.05.247H1.2V5.35h6.243zm-3.4 5.536h2.657c.48 0 .906-.05 1.307-.149.354-.99.674-.248.924-.446.215-.198.396-.43.478-.71.099-.265.148-.578.148-.924 0-.247-.05-.498-.124-.73a1.27 1.27 0 0 0-.42-.573 1.798 1.798 0 0 0-.717-.397c-.313-.099-.675-.148-1.143-.148H4.043v4.077zm0 5.8h3.085c.577 0 1.057-.08 1.45-.198a2.67 2.67 0 0 0 .973-.545c.248-.215.429-.478.545-.8.116-.309.165-.68.165-1.07 0-.783-.248-1.4-.732-1.799-.498-.406-1.202-.592-2.108-.592H4.043v5.003zm11.573-1.726c.313.43.76.644 1.39.644.446 0 .825-.116 1.154-.33.314-.214.512-.43.592-.675h1.945c-.313.958-.775 1.638-1.42 2.07-.643.413-1.42.643-2.345.643a4.541 4.541 0 0 1-1.624-.297 3.635 3.635 0 0 1-1.345-.874c-.378-.379-.675-.841-.89-1.389-.215-.545-.33-1.155-.33-1.823 0-.644.115-1.237.33-1.782.231-.546.528-1.007.94-1.369.38-.38.858-.675 1.37-.89a4.27 4.27 0 0 1 1.699-.314c.695 0 1.292.131 1.8.396a3.742 3.742 0 0 1 1.29 1.06c.327.45.576.967.734 1.554a6.56 6.56 0 0 1 .241 1.823h-5.836c0 .643.165 1.239.495 1.653zm2.493-4.55c-.247-.346-.693-.544-1.256-.544-.347 0-.643.08-.873.198-.231.115-.41.264-.528.444-.123.166-.214.33-.245.478-.038.148-.055.264-.07.347h3.391c-.064-.577-.18-1.007-.42-1.353v.43zm-3.05-5.154h4.766v1.477h-4.766V5.256z" />
                          </svg>
                        </a>
                      )}
                      
                      {artist.socialLinks.linkedin && (
                        <a href={artist.socialLinks.linkedin} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-blue-700 hover:text-blue-900">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
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