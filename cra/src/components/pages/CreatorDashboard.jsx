import React from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import StatCard from '../shared/StatCard';
import { useAppContext } from '../../contexts/AppContext';
import { FileText, ImageIcon, Music, Video, Code } from 'lucide-react';

const CreatorDashboard = () => {
  const { 
    creations, 
    folders, 
    handleEdit, 
    setActiveView 
  } = useAppContext();
  
  // Get icon for creation type
  const getCreationTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'image':
        return <ImageIcon className="creation-type-icon image-icon" />;
      case 'text':
        return <FileText className="creation-type-icon text-icon" />;
      case 'music':
        return <Music className="creation-type-icon music-icon" />;
      case 'video':
        return <Video className="creation-type-icon video-icon" />;
      case 'software':
        return <Code className="creation-type-icon software-icon" />;
      default:
        return <FileText className="creation-type-icon default-icon" />;
    }
  };
  
  return (
    <div className="dashboard">
      <div className="stats-container">
        <StatCard title="Total Creations" value={creations.length} />
        <StatCard title="Total Folders" value={folders.length} />
        <Card>
          <CardHeader className="stats-header">
            <CardTitle className="stats-title">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="activity-date">Last update: Today</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Creations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="recent-creations">
            {creations.slice(0, 5).map(creation => (
              <div key={creation.id} className="recent-creation-item">
                {getCreationTypeIcon(creation.type)}
                <div className="recent-creation-info">
                  <p className="recent-creation-title">{creation.title}</p>
                  <p className="recent-creation-date">Created: {creation.dateCreated}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="view-button"
                  onClick={() => handleEdit(creation)}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => setActiveView('myCreations')}>
            View All Creations
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreatorDashboard;