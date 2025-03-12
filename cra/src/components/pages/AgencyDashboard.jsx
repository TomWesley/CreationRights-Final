import React from 'react';
import { Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import CreatorDashboard from './CreatorDashboard';
import { useAppContext } from '../../contexts/AppContext';

const AgencyDashboard = () => {
  return (
    <div className="dashboard">
      <CreatorDashboard />
      
      <Card className="creator-management-card">
        <CardHeader>
          <CardTitle>Creator Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="creator-management">
            <Users className="creator-icon" />
            <p className="creator-management-title">Manage Your Creators</p>
            <p className="creator-management-desc">Connect with creators and manage rights assignments</p>
            <Button>View Creators</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyDashboard;