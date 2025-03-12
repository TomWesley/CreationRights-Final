import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useAppContext } from '../../contexts/AppContext';

const Settings = () => {
  const { currentUser } = useAppContext();
  
  return (
    <div className="settings-view">
      <h1 className="settings-title">Account Settings</h1>
      <Card className="settings-card">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="profile-settings">
            <div className="profile-form">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={currentUser?.name} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={currentUser?.email} />
              </div>
            </div>
            <Button className="save-profile-button">Save Changes</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="settings-card">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="password-settings">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
            <Button className="password-button">Update Password</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;