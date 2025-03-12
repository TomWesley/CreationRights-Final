// src/components/pages/YouTubeImport.jsx

import React, { useState } from 'react';
import { ArrowLeft, Check, ExternalLink, Loader2, Youtube } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAppContext } from '../../contexts/AppContext';
import { fetchYouTubeVideos, convertVideoToCreation } from '../../services/youtubeApi';
import { extractYouTubeMetadata } from '../../services/metadataExtraction';

const YouTubeImport = () => {
  const { setActiveView, creations, setCreations, currentUser, setCurrentCreation, setEditMode } = useAppContext();
  
  const [channelUrl, setChannelUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');
  const [selectedVideos, setSelectedVideos] = useState({});
  const [importSuccess, setImportSuccess] = useState(false);
  const [importingVideo, setImportingVideo] = useState(null);

  // Check if a video has already been imported
  const isVideoAlreadyImported = (videoId) => {
    return creations.some(creation => creation.id === `yt-${videoId}`);
  };

  // Handle form submission to fetch videos
  const handleFetchVideos = async (e) => {
    e.preventDefault();
    
    if (!channelUrl.trim()) {
      setError('Please enter a YouTube channel URL');
      return;
    }
    
    setError('');
    setIsLoading(true);
    setVideos([]);
    
    try {
      const fetchedVideos = await fetchYouTubeVideos(channelUrl);
      setVideos(fetchedVideos);
      
      // Pre-select videos that haven't been imported yet
      const initialSelected = {};
      fetchedVideos.forEach(video => {
        initialSelected[video.id] = !isVideoAlreadyImported(video.id);
      });
      setSelectedVideos(initialSelected);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError(error.message || 'Failed to fetch videos from YouTube');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle video selection
  const toggleVideoSelection = (videoId) => {
    setSelectedVideos(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  // Select or deselect all videos
  const handleSelectAll = (select) => {
    const newSelected = {};
    videos.forEach(video => {
      if (!isVideoAlreadyImported(video.id)) {
        newSelected[video.id] = select;
      }
    });
    setSelectedVideos(newSelected);
  };

  // Import single video with metadata
  const importSingleVideo = (video) => {
    setImportingVideo(video);
    
    // Convert video to creation object
    const creation = convertVideoToCreation(video);
    
    // Extract metadata
    const metadata = extractYouTubeMetadata(video);
    
    // Set current creation for metadata completion
    setCurrentCreation({
      ...creation,
      metadata
    });
    
    setEditMode(false);
    
    // Navigate to metadata completion page
    setActiveView('metadataCompletion');
  };

  // Import selected videos
  const handleImportVideos = () => {
    setIsLoading(true);
    
    try {
      const selectedVideoObjects = videos.filter(video => selectedVideos[video.id]);
      
      if (selectedVideoObjects.length === 0) {
        setError('Please select at least one video to import');
        setIsLoading(false);
        return;
      }
      
      if (selectedVideoObjects.length === 1) {
        // If only one video is selected, go to metadata completion flow
        importSingleVideo(selectedVideoObjects[0]);
        return;
      }
      
      // For multiple videos, batch import them
      const newCreations = selectedVideoObjects.map(video => {
        const creation = convertVideoToCreation(video);
        
        // Extract metadata
        const metadata = extractYouTubeMetadata(video);
        
        // Add user identifier and metadata to the creation
        creation.createdBy = currentUser.email;
        creation.createdAt = new Date().toISOString();
        creation.metadata = metadata;
        
        return creation;
      });
      
      // Add the new creations to the existing ones
      setCreations([...creations, ...newCreations]);
      console.log(`Imported ${newCreations.length} YouTube videos for user ${currentUser.email}`);
      
      setImportSuccess(true);
    } catch (error) {
      console.error('Error importing videos:', error);
      setError(error.message || 'Failed to import videos');
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
          <p className="mb-6">Your YouTube videos have been imported successfully.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => setActiveView('myCreations')}>
              View My Creations
            </Button>
            <Button variant="outline" onClick={() => {
              setVideos([]);
              setSelectedVideos({});
              setChannelUrl('');
              setImportSuccess(false);
            }}>
              Import More Videos
            </Button>
          </div>
        </div>
      );
    }
    
    if (videos.length > 0) {
      return (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Select Videos to Import</h2>
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
            {videos.map(video => {
              const isImported = isVideoAlreadyImported(video.id);
              
              return (
                <div 
                  key={video.id} 
                  className={`border rounded-md p-3 flex gap-3 ${
                    isImported ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-36 h-20 bg-gray-200 rounded overflow-hidden">
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="font-medium line-clamp-1">{video.title}</h3>
                    <p className="text-sm text-gray-500">
                      Published: {new Date(video.publishedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm line-clamp-1">{video.description}</p>
                    
                    {!isImported && (
                      <Button 
                        size="sm" 
                        variant="link" 
                        className="p-0 h-auto text-blue-600"
                        onClick={() => importSingleVideo(video)}
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
                        checked={selectedVideos[video.id] || false}
                        onChange={() => toggleVideoSelection(video.id)}
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
              setVideos([]);
              setSelectedVideos({});
            }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Button onClick={handleImportVideos} disabled={!Object.values(selectedVideos).some(Boolean)}>
              Import Selected Videos
            </Button>
          </div>
        </>
      );
    }
    
    return (
      <form onSubmit={handleFetchVideos}>
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="bg-red-100 inline-flex rounded-full p-4 mb-4">
              <Youtube className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold">Import from YouTube</h2>
            <p className="text-gray-600">
              Link your YouTube channel to import your videos
            </p>
          </div>
          
          <div>
            <Label htmlFor="channelUrl">YouTube Channel URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="channelUrl"
                placeholder="https://www.youtube.com/channel/UC..."
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                required
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Fetch Videos
              </Button>
            </div>
            <p className="text-xs mt-1 text-gray-500">
              Use the channel URL format: https://www.youtube.com/channel/UC...
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">How to find your YouTube channel ID</h3>
            <ol className="text-sm text-blue-700 list-decimal pl-5 space-y-1">
              <li>Go to your YouTube channel</li>
              <li>Click on "About" tab</li>
              <li>Click "Share" and then "Copy channel ID"</li>
              <li>Use the format: https://www.youtube.com/channel/YOUR_CHANNEL_ID</li>
            </ol>
          </div>
        </div>
      </form>
    );
  };

  return (
    <div className="youtube-import-container">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Import from YouTube</h1>
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

export default YouTubeImport;