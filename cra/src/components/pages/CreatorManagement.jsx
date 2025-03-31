// First, I'll update the CreatorManagement component to fetch and display real creators
import React, { useState, useEffect } from 'react';
import { Building2, UserPlus, User, Mail, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useAppContext } from '../../contexts/AppContext';

const CreatorManagement = () => {
  const [creators, setCreators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAppContext();

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setIsLoading(true);
        // We'll use the API to fetch users with userType = 'creator'
        const response = await fetch('/api/users?type=creator');
        if (!response.ok) {
          throw new Error('Failed to fetch creators');
        }
        const data = await response.json();
        setCreators(data);
      } catch (err) {
        console.error('Error fetching creators:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreators();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 rounded-lg">
        <p className="text-red-500 mb-2">Error loading creators: {error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (creators.length === 0) {
    return (
      <div className="creators-dashboard">
        <Building2 className="creators-icon" />
        <h2 className="creators-title">Creator Management</h2>
        <p className="creators-subtitle">
          No creators found. Add creators to start managing rights assignments.
        </p>
        <div className="creators-actions">
          <Button className="add-creator-button">
            <UserPlus className="button-icon" /> Add Creator
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Creator Management</h2>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" /> Add Creator
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators.map((creator) => (
          <Card key={creator.id || creator.email} className="overflow-hidden">
            <CardHeader className="pb-0">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold">
                  {creator.name || creator.email?.split('@')[0] || "NA"}
                </CardTitle>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Creator
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                  {creator.photoUrl ? (
                    <img 
                      src={creator.photoUrl} 
                      alt={creator.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <div className="text-sm space-y-1">
                    <p className="flex items-center text-gray-600">
                      <Mail className="h-3 w-3 mr-2 text-gray-400" />
                      {creator.email || "NA"}
                    </p>
                    <p className="flex items-center text-gray-600">
                      <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                      {creator.location || "NA"}
                    </p>
                    {creator.website && (
                      <p className="flex items-center text-gray-600">
                        <ExternalLink className="h-3 w-3 mr-2 text-gray-400" />
                        <a 
                          href={creator.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline truncate"
                        >
                          {creator.website.replace(/^https?:\/\//, '')}
                        </a>
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-1">Content Type</h4>
                    <div className="flex flex-wrap gap-1">
                      {(creator.contentTypes && creator.contentTypes.length > 0) ? (
                        creator.contentTypes.map(type => (
                          <span key={type} className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                            {type}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                          Unspecified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between">
                  <div>
                    <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Works</h4>
                    <p className="font-semibold text-lg">{creator.totalWorks || "0"}</p>
                  </div>
                  <div>
                    <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      creator.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {creator.status || "Pending"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" className="mr-2">View Profile</Button>
                <Button size="sm">Manage Rights</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CreatorManagement;