// src/components/pages/ProfilePage.jsx

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { User, Mail, Globe, MapPin, Image, FileText, Music, Video } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppContext } from '../../contexts/AppContext';

const ProfilePage = () => {
  const { currentUser, creations, setActiveView } = useAppContext();
  
  // Count creations by type
  const creationCounts = creations.reduce((counts, creation) => {
    const type = creation.type.toLowerCase();
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});
  
  // Recent creations (limit to 3)
  const recentCreations = creations.slice(0, 3);
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="profile-page">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left sidebar with profile info */}
        <div className="w-full md:w-1/3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center mb-6">
                {currentUser?.photoUrl ? (
                    <>
                        <img 
                        src={getProxiedImageUrl(currentUser.photoUrl, currentUser.email)} 
                        alt={currentUser.name} 
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md mb-4"
                        onError={(e) => {
                            console.error('Failed to load profile image:', currentUser.photoUrl);
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            // Show fallback icon
                            e.target.nextElementSibling.style.display = 'flex';
                        }}
                        />
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4" style={{display: 'none'}}>
                        <User className="h-16 w-16 text-gray-400" />
                        </div>
                    </>
                    ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                
                <h1 className="text-2xl font-bold">
                  {currentUser?.name || currentUser?.email?.split('@')[0]}
                </h1>
                
                <p className="text-gray-500 mb-2">
                  {currentUser?.userType === 'creator' ? 'Creator' : 'Agency'}
                </p>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setActiveView('settings')}
                  className="mt-2"
                >
                  Edit Profile
                </Button>
              </div>
              
              {/* Contact information */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{currentUser?.email}</span>
                </div>
                
                {currentUser?.website && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="h-4 w-4 mr-2" />
                    <a 
                      href={currentUser.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      {currentUser.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                
                {currentUser?.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{currentUser.location}</span>
                  </div>
                )}
              </div>
              
              {/* Bio section */}
              {currentUser?.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-gray-600 whitespace-pre-line">{currentUser.bio}</p>
                </div>
              )}
              
              {/* Stats */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Creation Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded text-center">
                    <p className="text-2xl font-bold">{creations.length}</p>
                    <p className="text-sm text-gray-500">Total Creations</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-center">
                    <p className="text-2xl font-bold">{Object.keys(creationCounts).length}</p>
                    <p className="text-sm text-gray-500">Content Types</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right side content */}
        <div className="w-full md:w-2/3">
          {/* Creation types */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Creation Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <Image className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-semibold">{creationCounts.image || 0}</p>
                  <p className="text-sm text-gray-600">Images</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <FileText className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold">{creationCounts.text || 0}</p>
                  <p className="text-sm text-gray-600">Text</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <Music className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="font-semibold">{creationCounts.music || 0}</p>
                  <p className="text-sm text-gray-600">Music</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <Video className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="font-semibold">{creationCounts.video || 0}</p>
                  <p className="text-sm text-gray-600">Video</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent creations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Creations</CardTitle>
            </CardHeader>
            <CardContent>
              {recentCreations.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No creations yet</p>
              ) : (
                <div className="space-y-4">
                  {recentCreations.map(creation => (
                    <div key={creation.id} className="border rounded-md p-4">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">{creation.title}</h3>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          {creation.type}
                        </span>
                      </div>
                      {creation.dateCreated && (
                        <p className="text-sm text-gray-500 mb-2">
                          Created: {formatDate(creation.dateCreated)}
                        </p>
                      )}
                      {creation.rights && (
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-medium">Rights:</span> {creation.rights}
                        </p>
                      )}
                      {creation.tags && creation.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {creation.tags.map(tag => (
                            <span 
                              key={tag}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="text-center mt-4">
                    <Button variant="outline" onClick={() => setActiveView('myCreations')}>
                      View All Creations
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;