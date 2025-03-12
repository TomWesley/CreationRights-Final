// src/components/shared/CreationCard.jsx

import React, { useState } from 'react';
import { Edit, Trash2, FileText, ImageIcon, Music, Video, Code, ExternalLink, Youtube, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useAppContext } from '../../contexts/AppContext';

const CreationCard = ({ creation }) => {
  const { handleEdit, handleDelete } = useAppContext();
  const [showMetadata, setShowMetadata] = useState(false);

  // Get icon for creation type
  const getCreationTypeIcon = (type, source) => {
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
  
  // Determine if this is a YouTube video
  const isYouTubeVideo = creation.source === 'YouTube';
  
  // Determine if this has metadata
  const hasMetadata = creation.metadata && Object.keys(creation.metadata).length > 0;
  
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
  
  return (
    <Card className="creation-card">
      <div className="creation-content">
        {/* YouTube videos show the thumbnail */}
        {isYouTubeVideo && creation.thumbnailUrl ? (
          <div className="creation-thumbnail" style={{ width: '160px', minWidth: '160px' }}>
            <img 
              src={creation.thumbnailUrl} 
              alt={creation.title} 
              className="w-full h-full object-cover"
              style={{ height: '90px' }}
            />
          </div>
        ) : null}
        
        <div className="creation-info-sidebar">
          <div>
            {getCreationTypeIcon(creation.type, creation.source)}
          </div>
          <div className="creation-meta">
            <p className="creation-title">{creation.title}</p>
            <p className="creation-date">{creation.dateCreated}</p>
            
            {isYouTubeVideo && creation.sourceUrl && (
              <a 
                href={creation.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs flex items-center text-blue-600 hover:underline mt-1"
              >
                <ExternalLink className="w-3 h-3 mr-1" /> View on YouTube
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
              
              {isYouTubeVideo && (
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
        </div>
        
        <div className="creation-actions">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleEdit(creation)}
            className="edit-button"
          >
            <Edit className="button-icon-small" /> Edit
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => handleDelete(creation.id)}
            className="delete-button"
          >
            <Trash2 className="button-icon-small" /> Delete
          </Button>
          
          {isYouTubeVideo && creation.sourceUrl && (
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

export default CreationCard;