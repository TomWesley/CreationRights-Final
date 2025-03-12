import React from 'react';
import { Building2, UserPlus, User } from 'lucide-react';
import { Button } from '../ui/button';

const CreatorManagement = () => {
  return (
    <div className="creators-dashboard">
      <Building2 className="creators-icon" />
      <h2 className="creators-title">Creator Management</h2>
      <p className="creators-subtitle">
        Connect with creators and manage rights assignments
      </p>
      <div className="creators-actions">
        <Button className="add-creator-button">
          <UserPlus className="button-icon" /> Add Creator
        </Button>
        <Button variant="outline" className="view-creators-button">
          <User className="button-icon" /> View Creators
        </Button>
      </div>
    </div>
  );
};

export default CreatorManagement;