// src/components/pages/TeamPage.jsx

import React, { useState } from 'react';
import { UserPlus, UserX, Users, Mail, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAppContext } from '../../contexts/AppContext';

const TeamPage = () => {
  const { currentUser } = useAppContext();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('collaborator');
  
  // This would be fetched from a database in a real app
  const [collaborators, setCollaborators] = useState([
    { id: 'c1', name: 'Alex Johnson', email: 'alex@example.com', role: 'Photographer', status: 'active' },
    { id: 'c2', name: 'Jamie Smith', email: 'jamie@example.com', role: 'Writer', status: 'active' },
    { id: 'c3', name: 'Taylor Brown', email: 'taylor@example.com', role: 'Designer', status: 'pending' }
  ]);
  
  const handleInviteSubmit = (e) => {
    e.preventDefault();
    
    // In a real app, this would send an invitation
    const newCollaborator = {
      id: `c${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'pending'
    };
    
    setCollaborators([...collaborators, newCollaborator]);
    setInviteEmail('');
    setInviteRole('collaborator');
    setShowInviteForm(false);
  };
  
  const handleRemoveCollaborator = (id) => {
    setCollaborators(collaborators.filter(c => c.id !== id));
  };
  
  return (
    <div className="team-page">
      <h1 className="text-2xl font-bold mb-6">Your Creative Team</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Collaborators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{collaborators.filter(c => c.status === 'active').length}</p>
            <p className="text-sm text-gray-500">{collaborators.filter(c => c.status === 'pending').length} pending invitations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">3 new shared works this month</p>
            <p className="text-sm text-gray-500">Last activity: 2 days ago</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Attribution Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">15 works with proper attribution</p>
            <p className="text-sm text-gray-500">All collaborators properly credited</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Team Members & Collaborators</CardTitle>
          <Button onClick={() => setShowInviteForm(!showInviteForm)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {showInviteForm ? 'Cancel' : 'Invite Collaborator'}
          </Button>
        </CardHeader>
        <CardContent>
          {showInviteForm && (
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <form onSubmit={handleInviteSubmit}>
                <h3 className="font-medium mb-3">Invite a New Collaborator</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="inviteEmail">Email Address</Label>
                    <Input 
                      id="inviteEmail" 
                      type="email" 
                      value={inviteEmail} 
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="collaborator@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="inviteRole">Role</Label>
                    <select 
                      id="inviteRole"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      <option value="collaborator">Collaborator</option>
                      <option value="photographer">Photographer</option>
                      <option value="writer">Writer</option>
                      <option value="designer">Designer</option>
                      <option value="musician">Musician</option>
                      <option value="producer">Producer</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Send Invitation</Button>
                </div>
              </form>
            </div>
          )}
          
          {collaborators.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Collaborators Yet</h3>
              <p className="text-gray-500 mb-4">Invite team members to collaborate on your creations</p>
              <Button onClick={() => setShowInviteForm(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Collaborator
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Name</th>
                    <th className="text-left py-2 px-4">Email</th>
                    <th className="text-left py-2 px-4">Role</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-right py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collaborators.map(collaborator => (
                    <tr key={collaborator.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{collaborator.name}</td>
                      <td className="py-3 px-4">{collaborator.email}</td>
                      <td className="py-3 px-4">{collaborator.role}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          collaborator.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {collaborator.status === 'active' ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`mailto:${collaborator.email}`)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <p className="text-sm text-gray-500">Collaborators can be credited in your works</p>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Permissions
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent Collaborations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex justify-between">
                <h3 className="font-medium">Summer Photoshoot Collection</h3>
                <span className="text-sm text-gray-500">3 days ago</span>
              </div>
              <p className="text-sm text-gray-600">Collaborated with: Alex Johnson, Jamie Smith</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex justify-between">
                <h3 className="font-medium">City Life Article Series</h3>
                <span className="text-sm text-gray-500">1 week ago</span>
              </div>
              <p className="text-sm text-gray-600">Collaborated with: Jamie Smith</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex justify-between">
                <h3 className="font-medium">Spring Marketing Campaign</h3>
                <span className="text-sm text-gray-500">2 weeks ago</span>
              </div>
              <p className="text-sm text-gray-600">Collaborated with: Taylor Brown, Alex Johnson</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamPage;