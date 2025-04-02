// src/components/shared/UserSearchBar.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import ProfilePhoto from './ProfilePhoto';
import { useAppContext } from '../../contexts/AppContext';

const UserSearchBar = ({ onSelectUser, placeholder = "Search for users..." }) => {
  const { currentUser } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search users
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      setShowResults(true);
      
      const response = await fetch(`${API_URL}/api/users/search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const data = await response.json();
      
      // Filter out current user from results
      const filteredResults = data.filter(user => user.email !== currentUser?.email);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="flex">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => searchQuery.trim() && setShowResults(true)}
          />
        </div>
        <Button
          onClick={handleSearch}
          className="ml-2"
          disabled={!searchQuery.trim()}
        >
          Search
        </Button>
      </div>
      
      {showResults && (
        <div className="absolute top-full left-0 right-0 bg-white border shadow-lg rounded-md mt-1 z-10 max-h-64 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No users found
            </div>
          ) : (
            <div>
              {searchResults.map(user => (
                <div 
                  key={user.email} 
                  className="p-3 cursor-pointer hover:bg-gray-50 flex items-center"
                  onClick={() => {
                    onSelectUser(user);
                    setShowResults(false);
                    setSearchQuery('');
                  }}
                >
                  <ProfilePhoto 
                    email={user.email}
                    name={user.name}
                    size="sm"
                  />
                  <div className="ml-2">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    {user.specialties && user.specialties.length > 0 && (
                      <div className="flex flex-wrap mt-1 gap-1">
                        {user.specialties.slice(0, 2).map((specialty, index) => (
                          <span 
                            key={index}
                            className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded"
                          >
                            {specialty}
                          </span>
                        ))}
                        {user.specialties.length > 2 && (
                          <span className="text-xs text-gray-500">+{user.specialties.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearchBar;