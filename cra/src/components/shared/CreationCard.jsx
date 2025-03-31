// src/components/shared/CreationCard.jsx - Modified for Agency View

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useAppContext } from '../../contexts/AppContext';
import { 
  Edit, Trash2, FileText, ImageIcon, Music, Video, Code, ExternalLink, 
  Youtube, Instagram, Info, ChevronDown, ChevronUp, Play, Pause, 
  Globe, DollarSign, Mail, User, BookmarkPlus, MessageSquare 
} from 'lucide-react';

const CreationCard = ({ creation, isAgencyView = false }) => {
  const { 
    handleEdit, 
    handleDelete, 
    handleUpdateCreation, 
    currentUser,
    userType
  } = useAppContext();
  
  const [showMetadata, setShowMetadata] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showCreatorInfo, setShowCreatorInfo] = useState(false);

  // Initialize audio player if it's an audio file
  useEffect(() => {
    if (creation.type === 'Music' || creation.type === 'Audio') {
      if (creation.fileUrl || creation.sourceUrl) {
        const audioElement = new Audio(creation.fileUrl || creation.sourceUrl);
        audioElement.addEventListener('ended', () => setIsPlaying(false));
        setAudio(audioElement);
      }
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [creation]);

  // Toggle audio playback
  const toggleAudio = () => {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Get icon for creation type
  const getCreationTypeIcon = (type, source) => {
    // If it's from Instagram, use the Instagram icon
    if (source === 'Instagram') {
      return <Instagram className="creation-type-icon text-purple-500" />;
    }
    
    // If it's from YouTube, use the YouTube icon
    if (source === 'YouTube') {
      return <Youtube className="creation-type-icon text-red-500" />;
    }
    
    // Otherwise use the normal type icons
    switch (type.toLowerCase()) {
      case 'image':
      case 'photography':
        return <ImageIcon className="creation-type-icon image-icon" />;
      case 'text':
      case 'literature':
        return <FileText className="creation-type-icon text-icon" />;
      case 'music':
      case 'audio':
        return <Music className="creation-type-icon music-icon" />;
      case 'video':
        return <Video className="creation-type-icon video-icon" />;
      case 'software':
        return <Code className="creation-type-icon software-icon" />;
      default:
        return <FileText className="creation-type-icon default-icon" />;
    }
  };
  
  // Handler for making creation public
  const handleMakePublic = () => {
    const updatedCreation = {
      ...creation,
      status: 'published'
    };
    handleUpdateCreation(updatedCreation);
  };

  // Toggle contact info visibility
  const toggleContactInfo = () => {
    setShowContactInfo(!showContactInfo);
  };
  
  // Toggle creator info visibility
  const toggleCreatorInfo = () => {
    setShowCreatorInfo(!showCreatorInfo);
  };
  
  // Determine if this has metadata
  const hasMetadata = creation.metadata && Object.keys(creation.metadata).length > 0;
  
  // Generate preview based on content type
  const renderContentPreview = () => {
    // For images
    if (creation.type === 'Image' || creation.type === 'Photography') {
      if (creation.fileUrl || creation.thumbnailUrl) {
        return (
          <div className="creation-thumbnail w-40 h-28 bg-gray-200 overflow-hidden">
            <img 
              src={creation.fileUrl || creation.thumbnailUrl} 
              alt={creation.title} 
              className="w-full h-full object-cover"
            />
          </div>
        );
      }
    }
    
    // For videos
    else if (creation.type === 'Video') {
      if (creation.thumbnailUrl) {
        return (
          <div className="creation-thumbnail w-40 h-28 bg-gray-200 overflow-hidden relative">
            <img 
              src={creation.thumbnailUrl} 
              alt={creation.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
        );
      }
    }
    
    // For audio
    else if (creation.type === 'Music' || creation.type === 'Audio') {
      return (
        <div className="creation-thumbnail w-40 h-28 bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full"
            onClick={toggleAudio}
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </Button>
        </div>
      );
    }
    
    // For literature
    else if (creation.type === 'Text' || creation.type === 'Literature') {
      return (
        <div className="creation-thumbnail w-40 h-28 bg-gradient-to-r from-green-100 to-green-300 flex items-center justify-center p-3">
          <FileText className="w-12 h-12 text-green-600" />
        </div>
      );
    }
    
    // Default thumbnail if no specific preview
    return null;
  };
  
  // Format metadata for display
  const renderMetadataSection = () => {
    if (!hasMetadata) return null;
    
    // Determine which fields to display based on metadata category
    let displayFields = [];
    const metadata = creation.metadata;
    
    switch (metadata.category) {
      case 'Literature':
        displayFields = [
          { key: 'creationRightsId', label: 'ID' },
          { key: 'author', label: 'Author' },
          { key: 'releaseDate', label: 'Released' },
          { key: 'publisher', label: 'Publisher' },
          { key: 'genre', label: 'Genre' },
          { key: 'pageCount', label: 'Pages' },
          { key: 'rightsHolders', label: 'Rights Holders' }
        ];
        break;
        
      case 'Audio':
        displayFields = [
          { key: 'creationRightsId', label: 'ID' },
          { key: 'artist', label: 'Artist' },
          { key: 'releaseDate', label: 'Released' },
          { key: 'recordingDate', label: 'Recorded' },
          { key: 'label', label: 'Label' },
          { key: 'genre', label: 'Genre' },
          { key: 'duration', label: 'Duration' },
          { key: 'producer', label: 'Producer' },
          { key: 'rightsHolders', label: 'Rights Holders' }
        ];
        break;
        
      case 'Photography':
        displayFields = [
          { key: 'creationRightsId', label: 'ID' },
          { key: 'photographer', label: 'Photographer' },
          { key: 'createdDate', label: 'Created' },
          { key: 'style', label: 'Style' },
          { key: 'dimensions', label: 'Dimensions' },
          { key: 'collection', label: 'Collection' },
          { key: 'rightsHolders', label: 'Rights Holders' }
        ];
        break;
        
      case 'Video':
        displayFields = [
          { key: 'creationRightsId', label: 'ID' },
          { key: 'creator', label: 'Creator' },
          { key: 'releaseDate', label: 'Released' },
          { key: 'recordingDate', label: 'Recorded' },
          { key: 'studio', label: 'Studio' },
          { key: 'genre', label: 'Genre' },
          { key: 'duration', label: 'Duration' },
          { key: 'rightsHolders', label: 'Rights Holders' }
        ];
        break;
        
      default:
        displayFields = [
          { key: 'creationRightsId', label: 'ID' },
          { key: 'rightsHolders', label: 'Rights Holders' }
        ];
    }
    
    return (
      <div className="mt-3 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {metadata.category} Metadata
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {displayFields.map(field => {
            if (!metadata[field.key]) return null;
            
            return (
              <div key={field.key} className="text-sm">
                <span className="text-gray-500">{field.label}:</span>{' '}
                <span className="font-medium">{metadata[field.key]}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render licensing information
  const renderLicensingInfo = () => {
    if (creation.status !== 'published') return null;
    
    if (creation.licensingCost) {
      return (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center text-sm font-medium text-green-700">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>Licensing Cost: ${creation.licensingCost}</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {!showContactInfo ? (
            <button 
              className="text-blue-600 text-sm flex items-center hover:text-blue-800"
              onClick={toggleContactInfo}
            >
              Get in touch with the creator
            </button>
          ) : (
            <div className="text-sm">
              <p className="font-medium mb-1">Contact information:</p>
              <div className="flex items-center text-gray-700">
                <Mail className="h-4 w-4 mr-1" />
                <a href={`mailto:${creation.createdBy || 'creator@example.com'}`} className="text-blue-600 hover:underline">
                  {creation.createdBy || 'creator@example.com'}
                </a>
              </div>
            </div>
          )}
        </div>
      );
    }
  };
  
  // Render creator info for agency view
  const renderCreatorInfo = () => {
    if (!creation.createdBy) return null;
    
    return (
      <div className="mt-3 pt-3 border-t border-gray-200">
        {!showCreatorInfo ? (
          <button 
            className="text-blue-600 text-sm flex items-center hover:text-blue-800"
            onClick={toggleCreatorInfo}
          >
            <User className="h-4 w-4 mr-1" />
            View Creator Info
          </button>
        ) : (
          <div className="text-sm">
            <p className="font-medium mb-1">Created by:</p>
            <div className="p-2 bg-blue-50 rounded-md">
              <p>{creation.createdBy}</p>
              {creation.metadata && creation.metadata.creator && (
                <p className="text-gray-600 mt-1">Artist: {creation.metadata.creator}</p>
              )}
              {creation.metadata && creation.metadata.rightsHolders && (
                <p className="text-gray-600">Rights Holders: {creation.metadata.rightsHolders}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="creation-card">
      <div className="creation-content">
        {/* Content Preview */}
        {renderContentPreview()}
        
        <div className="creation-info-sidebar">
          <div>
            {getCreationTypeIcon(creation.type, creation.source)}
          </div>
          <div className="creation-meta">
            <p className="creation-title">{creation.title}</p>
            <p className="creation-date">{creation.dateCreated}</p>
            
            {/* Status Badge */}
            <div className="mt-1">
              {creation.status === 'published' ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center w-fit">
                  <Globe className="h-3 w-3 mr-1" />
                  Published
                </span>
              ) : (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center w-fit">
                  Draft
                </span>
              )}
            </div>
            
            {creation.source === 'YouTube' && creation.sourceUrl && (
              <a 
                href={creation.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs flex items-center text-blue-600 hover:underline mt-1"
              >
                <ExternalLink className="w-3 h-3 mr-1" /> View on YouTube
              </a>
            )}
            
            {creation.type === 'Literature' && creation.sourceUrl && (
              <a 
                href={creation.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs flex items-center text-blue-600 hover:underline mt-1"
              >
                <ExternalLink className="w-3 h-3 mr-1" /> View Source
              </a>
            )}
            
            {hasMetadata && creation.metadata.creationRightsId && (
              <div className="text-xs text-gray-500 mt-1">
                ID: {creation.metadata.creationRightsId}
              </div>
            )}
          </div>
        </div>
        
        <div className="creation-details">
          {creation.rights && (
            <div className="creation-rights">
              <p className="details-label">Rights</p>
              <p>{creation.rights}</p>
            </div>
          )}
          {creation.notes && (
            <div className="creation-notes">
              <p className="details-label">Notes</p>
              <p className="notes-text">{creation.notes}</p>
            </div>
          )}
          {creation.tags && creation.tags.length > 0 && (
            <div className="creation-tags">
              {creation.tags.map(tag => (
                <span 
                  key={tag} 
                  className="tag"
                >
                  {tag}
                </span>
              ))}
              
              {creation.source === 'YouTube' && (
                <span className="tag bg-red-100 text-red-700">
                  YouTube
                </span>
              )}
              
              {hasMetadata && creation.metadata.category && (
                <span className="tag bg-purple-100 text-purple-700">
                  {creation.metadata.category}
                </span>
              )}
            </div>
          )}
          
          {hasMetadata && showMetadata && renderMetadataSection()}
          
          {/* Show licensing information for published creations */}
          {creation.status === 'published' && renderLicensingInfo()}
          
          {/* Show creator info for agency view */}
          {isAgencyView && renderCreatorInfo()}
        </div>
        
        <div className="creation-actions">
          {!isAgencyView ? (
            // Creator view actions
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleEdit(creation)}
                className="edit-button"
              >
                <Edit className="button-icon-small" /> Edit
              </Button>
              
              {/* Make Public button - only show for draft status */}
              {creation.status !== 'published' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleMakePublic}
                  className="publish-button bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                >
                  <Globe className="button-icon-small" /> Make Public
                </Button>
              )}
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleDelete(creation.id)}
                className="delete-button"
              >
                <Trash2 className="button-icon-small" /> Delete
              </Button>
            </>
          ) : (
            // Agency view actions
            <>
              {creation.licensingCost ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="license-button bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                >
                  <DollarSign className="button-icon-small" /> License (${creation.licensingCost})
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="contact-button"
                  onClick={toggleContactInfo}
                >
                  <Mail className="button-icon-small" /> Contact Creator
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                className="bookmark-button"
              >
                <BookmarkPlus className="button-icon-small" /> Save
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="message-button"
              >
                <MessageSquare className="button-icon-small" /> Send Message
              </Button>
            </>
          )}
          
          {creation.sourceUrl && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(creation.sourceUrl, '_blank')}
              className="view-button"
            >
              <ExternalLink className="button-icon-small" /> View
            </Button>
          )}
          
          {hasMetadata && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMetadata(!showMetadata)}
              className="metadata-button"
            >
              <Info className="button-icon-small" />
              {showMetadata ? (
                <>
                  <span className="mr-1">Hide Metadata</span>
                  <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  <span className="mr-1">Show Metadata</span>
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </Button>
          )}
        </div>
        </div>
        </Card>
      );
    };
      

    export default CreationCard