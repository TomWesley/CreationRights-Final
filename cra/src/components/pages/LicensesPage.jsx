// src/components/pages/LicensesPage.jsx

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, FileText, Download, ExternalLink, DollarSign, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';

const LicensesPage = () => {
  const { userType, currentUser, isLoading, setIsLoading } = useAppContext();
  const [licenses, setLicenses] = useState([]);
  const [creations, setCreations] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLicenses, setFilteredLicenses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Fetch licenses on component mount
  useEffect(() => {
    const fetchLicenses = async () => {
      if (!currentUser?.email) return;
      
      setIsLoading(true);
      
      try {
        // The endpoint differs based on user type
        const endpoint = userType === 'creator' 
          ? '/api/users/licenses/created'  // Endpoint for licenses of creations made by this user
          : '/api/user/licenses';          // Endpoint for licenses purchased by this user
        
        const response = await fetch(`${endpoint}?email=${encodeURIComponent(currentUser.email)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch licenses: ${response.statusText}`);
        }
        
        const data = await response.json();
        setLicenses(data);
        
        // For each unique creationId, fetch creation details
        const uniqueCreationIds = [...new Set(data.map(license => license.creationId))];
        const creationsData = {};
        
        await Promise.all(uniqueCreationIds.map(async (creationId) => {
          try {
            const creationResponse = await fetch(`/api/creations/${creationId}`);
            if (creationResponse.ok) {
              const creationData = await creationResponse.json();
              creationsData[creationId] = creationData;
            }
          } catch (err) {
            console.error(`Error fetching creation ${creationId}:`, err);
          }
        }));
        
        setCreations(creationsData);
      } catch (error) {
        console.error('Error fetching licenses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLicenses();
  }, [currentUser, userType, setIsLoading]);
  
  // Filter and sort licenses
  useEffect(() => {
    if (!Array.isArray(licenses)) {
      setFilteredLicenses([]);
      return;
    }
    
    let filtered = [...licenses];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(license => 
        // Search in creation name if available
        (creations[license.creationId]?.title?.toLowerCase().includes(query)) ||
        // Search in license ID
        license.id.toLowerCase().includes(query) ||
        // Search in purchaser email
        (license.purchaserEmail?.toLowerCase().includes(query)) ||
        // Search in creator email
        (license.creatorEmail?.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp || 0);
          bValue = new Date(b.timestamp || 0);
          break;
        case 'amount':
          aValue = parseFloat(a.amount || 0);
          bValue = parseFloat(b.amount || 0);
          break;
        case 'creation':
          aValue = creations[a.creationId]?.title || '';
          bValue = creations[b.creationId]?.title || '';
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
    
    setFilteredLicenses(filtered);
  }, [licenses, searchQuery, sortField, sortDirection, creations]);
  
  // Toggle sort direction when clicking on the same field
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Format currency for display
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString || 'Unknown date';
    }
  };
  
  return (
    <div className="licenses-view">
      <div className="licenses-header">
        <div>
          <h1 className="licenses-title">
            {userType === 'creator' ? 'Licenses Sold' : 'Licenses Purchased'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {userType === 'creator'
              ? 'View and manage all licenses sold for your creations'
              : 'View licenses you have purchased for creative works'}
          </p>
        </div>
        
        <div className="licenses-actions">
          <div className="search-container">
            <Search className="search-icon" />
            <Input
              placeholder="Search licenses..."
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
                <label className="text-sm font-medium mb-1 block">Sort By</label>
                <div className="flex space-x-2">
                  <Button 
                    variant={sortField === 'timestamp' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleSort('timestamp')}
                    className="flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Date {sortField === 'timestamp' && (
                      sortDirection === 'asc' ? '↑' : '↓'
                    )}
                  </Button>
                  
                  <Button 
                    variant={sortField === 'amount' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleSort('amount')}
                    className="flex items-center"
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Amount {sortField === 'amount' && (
                      sortDirection === 'asc' ? '↑' : '↓'
                    )}
                  </Button>
                  
                  <Button 
                    variant={sortField === 'creation' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleSort('creation')}
                    className="flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Creation {sortField === 'creation' && (
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
        <CardHeader>
          <CardTitle>
            {userType === 'creator' 
              ? `${filteredLicenses.length} Licenses Sold` 
              : `${filteredLicenses.length} Licenses Purchased`}
          </CardTitle>
          <CardDescription>
            {userType === 'creator'
              ? 'Revenue from licenses sold for your creative works'
              : 'Licenses you have purchased for creative works'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading licenses...</p>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Licenses Found</h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Try adjusting your search or filters' 
                  : userType === 'creator'
                    ? 'You haven\'t sold any licenses yet'
                    : 'You haven\'t purchased any licenses yet'}
              </p>
            </div>
          ) : (
            <div className="licenses-list space-y-4">
              {filteredLicenses.map(license => (
                <Card key={license.id} className="license-card p-4 border border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="license-details flex-grow">
                      <h3 className="text-lg font-medium">
                        {creations[license.creationId]?.title || 'Untitled Creation'}
                      </h3>
                      
                      <div className="license-meta grid grid-cols-2 gap-x-8 gap-y-2 mt-2">
                        <div className="text-sm">
                          <span className="text-gray-500">License ID:</span>{' '}
                          <span className="font-medium">{license.id}</span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-gray-500">Amount:</span>{' '}
                          <span className="font-medium text-green-600">
                            {formatCurrency(license.amount, license.currency)}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-gray-500">
                            {userType === 'creator' ? 'Purchased by:' : 'Creator:'}
                          </span>{' '}
                          <span className="font-medium">
                            {userType === 'creator' 
                              ? (license.purchaserEmail || 'Unknown') 
                              : (license.creatorEmail || 'Unknown')}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-gray-500">Date:</span>{' '}
                          <span className="font-medium">{formatDate(license.timestamp)}</span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-gray-500">Status:</span>{' '}
                          <span className={`font-medium ${
                            license.status === 'active' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {license.status || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="license-actions mt-4 md:mt-0 flex flex-col space-y-2">
                      {creations[license.creationId]?.fileUrl && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          as="a" 
                          href={creations[license.creationId].fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whitespace-nowrap"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" /> View Content
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        <Download className="h-4 w-4 mr-1" /> License Certificate
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {filteredLicenses.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium mb-2 text-blue-700">About Licenses</h3>
          <p className="text-sm text-blue-600">
            {userType === 'creator'
              ? 'These are licenses that have been sold for your creative works. The revenue is transferred to your account after payment processing fees.'
              : 'These are licenses you have purchased for creative works. You can download license certificates for your records.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default LicensesPage;