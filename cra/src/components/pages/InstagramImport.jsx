// src/components/pages/InstagramImport.jsx
import React, { useState } from 'react';
import { ArrowLeft, Check, ExternalLink, Loader2, Instagram } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAppContext } from '../../contexts/AppContext';

const InstagramImport = () => {
  const { setActiveView, creations, setCreations, currentUser, setCurrentCreation, setEditMode } = useAppContext();
  
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [selectedPosts, setSelectedPosts] = useState({});
  const [importSuccess, setImportSuccess] = useState(false);
  const [importingPost, setImportingPost] = useState(null);

  // Check if a post has already been imported
  const isPostAlreadyImported = (postId) => {
    return creations.some(creation => creation.id === `ig-${postId}`);
  };

  // Handle form submission to fetch posts
  const handleFetchPosts = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter an Instagram username');
      return;
    }
    
    setError('');
    setIsLoading(true);
    setPosts([]);
    
    try {
      // Normalize the username (remove @ if present)
      const normalizedUsername = username.startsWith('@') ? username.substring(1) : username;
      
      console.log(`Fetching posts for Instagram user: ${normalizedUsername}`);
      
      // Direct call to Apify API
      const apifyToken = 'apify_api_IwtubPMgbGcCcfYqFhxy5zNkFKPXF14njt05';
      // Use instagram-profile-scraper instead
      const apifyUrl = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync?token=${apifyToken}`;
      
      const response = await fetch(apifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: normalizedUsername,
          resultsLimit: 20,
          addPosts: true,
          proxy: {
            useApifyProxy: true
          }
        })
      });
      
      // Log response status for debugging
      console.log(`Response status: ${response.status}`);
      
      // Check for non-200 responses and handle them
      if (!response.ok) {
        // Try to parse the error message if possible
        let errorMessage;
        try {
          const errorText = await response.text();
          console.log('Error response:', errorText);
          
          // Check if it's HTML (starts with <!DOCTYPE or <html)
          if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
            errorMessage = `Server returned HTML instead of JSON (status ${response.status})`;
          } else {
            // Try to parse as JSON
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorData.error || `Error: ${response.status} ${response.statusText}`;
            } catch (parseError) {
              errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
          }
        } catch (parseError) {
          errorMessage = `Server returned error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse JSON response
      const apifyData = await response.json();
      console.log('Raw Apify response:', JSON.stringify(apifyData, null, 2));
      
      // Check if we got data - the structure could be different from what we expect
      if (!apifyData) {
        setError(`No data found for ${normalizedUsername}. The account may be private or not exist.`);
        setIsLoading(false);
        return;
      }
      
      // Let's examine the structure of the response
      console.log('Response type:', typeof apifyData);
      console.log('Response keys:', Object.keys(apifyData));
      
      // If it's a profile object with posts
      if (apifyData.posts && Array.isArray(apifyData.posts)) {
        const fetchedPosts = apifyData.posts.map(post => ({
          id: post.id || `instagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          caption: post.caption || '',
          type: post.videoUrl ? 'Video' : 'Image',
          thumbnailUrl: post.displayUrl || post.thumbnailUrl || post.imageUrl || post.previewUrl,
          imageUrl: post.displayUrl || post.imageUrl,
          videoUrl: post.videoUrl || null,
          publishedAt: post.timestamp ? new Date(post.timestamp * 1000).toISOString() : new Date().toISOString(),
          url: post.url || post.permalink || `https://www.instagram.com/p/${post.shortCode || post.code}/`,
          likes: post.likesCount || post.likes || 0,
          comments: post.commentsCount || post.comments || 0,
          source: 'Instagram',
          sourceUrl: post.url || post.permalink || `https://www.instagram.com/p/${post.shortCode || post.code}/`
        }));
        
        console.log(`Processed ${fetchedPosts.length} posts`);
        setPosts(fetchedPosts);
        
        // Pre-select posts that haven't been imported yet
        const initialSelected = {};
        fetchedPosts.forEach(post => {
          initialSelected[post.id] = !isPostAlreadyImported(post.id);
        });
        setSelectedPosts(initialSelected);
      }
      // If it's an object with a profile key
      else if (apifyData.data && apifyData.data.user && apifyData.data.user.edge_owner_to_timeline_media) {
        // Handle the GraphQL API response format
        const edges = apifyData.data.user.edge_owner_to_timeline_media.edges || [];
        const fetchedPosts = edges.map(edge => {
          const node = edge.node;
          return {
            id: node.id || `instagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
            type: node.is_video ? 'Video' : 'Image',
            thumbnailUrl: node.display_url || node.thumbnail_src,
            imageUrl: node.display_url,
            videoUrl: node.video_url || null,
            publishedAt: new Date(node.taken_at_timestamp * 1000).toISOString(),
            url: `https://www.instagram.com/p/${node.shortcode}/`,
            likes: node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0,
            comments: node.edge_media_to_comment?.count || 0,
            source: 'Instagram',
            sourceUrl: `https://www.instagram.com/p/${node.shortcode}/`
          };
        });
        
        console.log(`Processed ${fetchedPosts.length} posts from GraphQL data`);
        setPosts(fetchedPosts);
        
        // Pre-select posts that haven't been imported yet
        const initialSelected = {};
        fetchedPosts.forEach(post => {
          initialSelected[post.id] = !isPostAlreadyImported(post.id);
        });
        setSelectedPosts(initialSelected);
      }
      // If it's an array of items
      else if (Array.isArray(apifyData)) {
        console.log('Response is an array with length:', apifyData.length);
        
        // Try to find posts directly in the array
        let fetchedPosts = apifyData
          .filter(item => item.id && (item.imageUrl || item.displayUrl || item.thumbnailUrl))
          .map(post => ({
            id: post.id || `instagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            caption: post.caption || '',
            type: post.videoUrl ? 'Video' : 'Image',
            thumbnailUrl: post.displayUrl || post.thumbnailUrl || post.imageUrl || post.previewUrl,
            imageUrl: post.displayUrl || post.imageUrl,
            videoUrl: post.videoUrl || null,
            publishedAt: post.timestamp ? new Date(post.timestamp * 1000).toISOString() : new Date().toISOString(),
            url: post.url || post.permalink || `https://www.instagram.com/p/${post.shortCode || post.code}/`,
            likes: post.likesCount || post.likes || 0,
            comments: post.commentsCount || post.comments || 0,
            source: 'Instagram',
            sourceUrl: post.url || post.permalink || `https://www.instagram.com/p/${post.shortCode || post.code}/`
          }));
        
        // If we didn't find posts directly, look for a profile item with posts
        if (fetchedPosts.length === 0) {
          const profileItem = apifyData.find(item => 
            item.username && item.username.toLowerCase() === normalizedUsername.toLowerCase() && item.posts
          );
          
          if (profileItem && Array.isArray(profileItem.posts)) {
            fetchedPosts = profileItem.posts.map(post => ({
              id: post.id || `instagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              caption: post.caption || '',
              type: post.videoUrl ? 'Video' : 'Image',
              thumbnailUrl: post.displayUrl || post.thumbnailUrl || post.imageUrl || post.previewUrl,
              imageUrl: post.displayUrl || post.imageUrl,
              videoUrl: post.videoUrl || null,
              publishedAt: post.timestamp ? new Date(post.timestamp * 1000).toISOString() : new Date().toISOString(),
              url: post.url || post.permalink || `https://www.instagram.com/p/${post.shortCode || post.code}/`,
              likes: post.likesCount || post.likes || 0,
              comments: post.commentsCount || post.comments || 0,
              source: 'Instagram',
              sourceUrl: post.url || post.permalink || `https://www.instagram.com/p/${post.shortCode || post.code}/`
            }));
          }
        }
        
        if (fetchedPosts.length > 0) {
          console.log(`Processed ${fetchedPosts.length} posts from array data`);
          setPosts(fetchedPosts);
          
          // Pre-select posts that haven't been imported yet
          const initialSelected = {};
          fetchedPosts.forEach(post => {
            initialSelected[post.id] = !isPostAlreadyImported(post.id);
          });
          setSelectedPosts(initialSelected);
        } else {
          setError(`Could not find posts for ${normalizedUsername} in the API response. The account may be private or have no posts.`);
        }
      }
      else {
        // We got a response, but it doesn't have the structure we expect
        console.log('Unexpected response structure:', apifyData);
        setError(`Received response but could not find posts for ${normalizedUsername}. The data format is unexpected.`);
      }
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      setError(error.message || 'Failed to fetch posts from Instagram');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle post selection
  const togglePostSelection = (postId) => {
    setSelectedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Select or deselect all posts
  const handleSelectAll = (select) => {
    const newSelected = {};
    posts.forEach(post => {
      if (!isPostAlreadyImported(post.id)) {
        newSelected[post.id] = select;
      }
    });
    setSelectedPosts(newSelected);
  };

  // Import single post with metadata
  const importSinglePost = (post) => {
    setImportingPost(post);
    
    // Convert post to creation object
    const creation = {
      id: `ig-${post.id}`,
      title: post.caption ? 
        (post.caption.length > 60 ? post.caption.substring(0, 57) + '...' : post.caption) : 
        `Instagram post from ${new Date(post.publishedAt).toLocaleDateString()}`,
      type: post.type,
      dateCreated: new Date(post.publishedAt).toISOString().split('T')[0],
      rights: `Copyright © ${new Date(post.publishedAt).getFullYear()} Instagram User`,
      notes: post.caption || '',
      tags: ['instagram', post.type.toLowerCase()],
      folderId: '',
      thumbnailUrl: post.thumbnailUrl,
      sourceUrl: post.sourceUrl,
      source: 'Instagram',
      metadata: {
        category: post.type === 'Video' ? 'Video' : 'Photography',
        creationRightsId: `CR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        platform: 'Instagram',
        engagement: {
          likes: post.likes,
          comments: post.comments
        },
        url: post.sourceUrl
      }
    };
    
    // Set current creation for metadata completion
    setCurrentCreation(creation);
    
    setEditMode(false);
    
    // Navigate to metadata completion page
    setActiveView('metadataCompletion');
  };

  // Import selected posts
  const handleImportPosts = () => {
    setIsLoading(true);
    
    try {
      const selectedPostObjects = posts.filter(post => selectedPosts[post.id]);
      
      if (selectedPostObjects.length === 0) {
        setError('Please select at least one post to import');
        setIsLoading(false);
        return;
      }
      
      if (selectedPostObjects.length === 1) {
        // If only one post is selected, go to metadata completion flow
        importSinglePost(selectedPostObjects[0]);
        return;
      }
      
      // For multiple posts, batch import them
      const newCreations = selectedPostObjects.map(post => {
        const creation = {
          id: `ig-${post.id}`,
          title: post.caption ? 
            (post.caption.length > 60 ? post.caption.substring(0, 57) + '...' : post.caption) : 
            `Instagram post from ${new Date(post.publishedAt).toLocaleDateString()}`,
          type: post.type,
          dateCreated: new Date(post.publishedAt).toISOString().split('T')[0],
          rights: `Copyright © ${new Date(post.publishedAt).getFullYear()} Instagram User`,
          notes: post.caption || '',
          tags: ['instagram', post.type.toLowerCase()],
          folderId: '',
          thumbnailUrl: post.thumbnailUrl,
          sourceUrl: post.sourceUrl,
          source: 'Instagram',
          // Add user identifier and metadata
          createdBy: currentUser.email,
          createdAt: new Date().toISOString(),
          metadata: {
            category: post.type === 'Video' ? 'Video' : 'Photography',
            creationRightsId: `CR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            platform: 'Instagram',
            engagement: {
              likes: post.likes,
              comments: post.comments
            },
            url: post.sourceUrl
          }
        };
        
        return creation;
      });
      
      // Add the new creations to the existing ones
      setCreations([...creations, ...newCreations]);
      console.log(`Imported ${newCreations.length} Instagram posts for user ${currentUser.email}`);
      
      setImportSuccess(true);
    } catch (error) {
      console.error('Error importing posts:', error);
      setError(error.message || 'Failed to import posts');
    } finally {
      setIsLoading(false);
    }
  };

  // Render different stages of the import process
  const renderContent = () => {
    if (importSuccess) {
      return (
        <div className="text-center py-8">
          <div className="bg-green-100 text-green-700 rounded-full p-4 inline-flex mb-4">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Import Successful!</h2>
          <p className="mb-6">Your Instagram posts have been imported successfully.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => setActiveView('myCreations')}>
              View My Creations
            </Button>
            <Button variant="outline" onClick={() => {
              setPosts([]);
              setSelectedPosts({});
              setUsername('');
              setImportSuccess(false);
            }}>
              Import More Posts
            </Button>
          </div>
        </div>
      );
    }
    
    if (posts.length > 0) {
      return (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Select Posts to Import</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleSelectAll(true)}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSelectAll(false)}>
                Deselect All
              </Button>
            </div>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
            {posts.map(post => {
              const isImported = isPostAlreadyImported(post.id);
              
              return (
                <div 
                  key={post.id} 
                  className={`border rounded-md p-3 flex gap-3 ${
                    isImported ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-36 h-36 bg-gray-200 rounded overflow-hidden">
                    <img 
                      src={post.thumbnailUrl} 
                      alt={post.caption?.substring(0, 20) || 'Instagram post'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center mb-1">
                      <h3 className="font-medium line-clamp-1">
                        {post.caption?.substring(0, 60) || `Post from ${new Date(post.publishedAt).toLocaleDateString()}`}
                        {post.caption?.length > 60 ? '...' : ''}
                      </h3>
                      <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                        {post.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Published: {new Date(post.publishedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {post.likes} likes • {post.comments} comments
                    </p>
                    
                    {!isImported && (
                      <Button 
                        size="sm" 
                        variant="link" 
                        className="p-0 h-auto text-blue-600"
                        onClick={() => importSinglePost(post)}
                      >
                        Import with detailed metadata
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 ml-2">
                    {isImported ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Already imported
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={selectedPosts[post.id] || false}
                        onChange={() => togglePostSelection(post.id)}
                        className="h-5 w-5"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => {
              setPosts([]);
              setSelectedPosts({});
            }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Button 
              onClick={handleImportPosts} 
              disabled={!Object.values(selectedPosts).some(Boolean)}
            >
              Import Selected Posts
            </Button>
          </div>
        </>
      );
    }
    
    return (
      <form onSubmit={handleFetchPosts}>
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="bg-purple-100 inline-flex rounded-full p-4 mb-4">
              <Instagram className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold">Import from Instagram</h2>
            <p className="text-gray-600">
              Enter an Instagram username to import posts
            </p>
          </div>
          
          <div>
            <Label htmlFor="username">Instagram Username</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="username"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Fetch Posts
              </Button>
            </div>
            <p className="text-xs mt-1 text-gray-500">
              Enter the username without @ symbol
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">Important Notes</h3>
            <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
              <li>This uses Apify's Instagram scraper to fetch public posts</li>
              <li>Private accounts cannot be scraped</li>
              <li>Instagram's terms of service may restrict automated scraping</li>
              <li>Use this feature responsibly and respect copyright</li>
            </ul>
          </div>
        </div>
      </form>
    );
  };

  return (
    <div className="instagram-import-container">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Import from Instagram</h1>
        <Button variant="outline" size="sm" onClick={() => setActiveView('myCreations')}>
          Cancel
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstagramImport;