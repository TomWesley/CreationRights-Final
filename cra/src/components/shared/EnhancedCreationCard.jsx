import React from 'react';
import { Calendar, Tag, Edit, Trash2, Eye, EyeOff, Info, Clipboard } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useToast } from '../ui/use-toast';

const EnhancedCreationCard = ({ 
  creation, 
  handleEdit, 
  handleDelete, 
  handleTogglePublish,
  isAgencyView = false,
  currentUser
}) => {
  const { toast } = useToast();
  
  const {
    id,
    title,
    type,
    status,
    dateCreated,
    thumbnailUrl,
    tags = [],
    licensingCost,
    metadata = {}
  } = creation;
  
  // Format the licensing cost
  const formattedCost = licensingCost 
    ? `$${parseFloat(licensingCost).toFixed(2)}` 
    : 'Not specified';
  
  // Extract metadata values with fallbacks
  const {
    photographer = 'Not specified',
    rightsHolders = 'Not specified',
    style = 'Not specified',
    collection = '',
    createdDate = dateCreated
  } = metadata;
  
  // Copy ID to clipboard
  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(id);
    toast({
      title: "ID Copied",
      description: "Creation ID copied to clipboard",
      variant: "default"
    });
  };
  
  return (
    <Card className="creation-card overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-500">No preview available</span>
          </div>
        )}
        <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
          <Badge variant={status === 'published' ? 'success' : 'secondary'} className="text-xs">
            {status === 'published' ? 'Published' : 'Draft'}
          </Badge>
          <Badge variant="outline" className="text-xs bg-white/80">
            {type}
          </Badge>
        </div>
      </div>
      
      <CardContent className="flex-grow p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-1">{title}</h3>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="h-3.5 w-3.5" />
            <span>{createdDate || dateCreated}</span>
          </div>
          <div className="text-gray-600 flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" />
            <span>{formattedCost}</span>
          </div>
          
          <div className="col-span-2 mt-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">By:</span> {photographer}
            </p>
          </div>
          
          {rightsHolders && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Rights:</span> {rightsHolders}
              </p>
            </div>
          )}
          
          {style && style !== 'Not specified' && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Style:</span> {style}
              </p>
            </div>
          )}
          
          {collection && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Collection:</span> {collection}
              </p>
            </div>
          )}
        </div>
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs py-0">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0">
                      +{tags.length - 3}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tags.slice(3).join(', ')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-3 pt-0 border-t flex justify-between gap-2">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={copyIdToClipboard}
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy ID: {id}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-1">
          {!isAgencyView && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8"
                onClick={() => handleTogglePublish(creation)}
              >
                {status === 'published' ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Publish
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => handleEdit(creation)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDelete(creation.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default EnhancedCreationCard;