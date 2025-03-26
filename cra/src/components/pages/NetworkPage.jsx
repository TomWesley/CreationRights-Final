// src/components/pages/NetworkPage.jsx

import React, { useState } from 'react';
import { MessageSquare, Building, Bell, Check, X, ExternalLink, Mail, Phone, Filter, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { useAppContext } from '../../contexts/AppContext';

const NetworkPage = () => {
  const { currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState('messages');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sample data - would come from API in real application
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      agency: 'Creative Arts Agency',
      subject: 'Representation Opportunity',
      message: 'Weve been following your work and would love to discuss representing you for future opportunities.',
      date: '2025-03-15',
      unread: true,
      type: 'offer'
    },
    {
      id: 'm2',
      agency: 'Media Rights Group',
      subject: 'Licensing Request',
      message: 'Were interested in licensing your photography series "Urban Reflections" for an upcoming campaign.',
      date: '2025-03-10',
      unread: false,
      type: 'request'
    },
    {
      id: 'm3',
      agency: 'Global Publishing House',
      subject: 'Collaboration Proposal',
      message: 'We have an author looking for a photographer for their upcoming book cover and thought your style would be perfect.',
      date: '2025-03-05',
      unread: false,
      type: 'offer'
    }
  ]);
  
  const [agencies, setAgencies] = useState([
    {
      id: 'a1',
      name: 'Creative Arts Agency',
      type: 'Representation',
      description: 'Full-service agency representing visual artists, photographers and writers.',
      website: 'https://www.creativeagency.example',
      email: 'contact@creativeagency.example',
      phone: '+1 (555) 123-4567',
      connected: true
    },
    {
      id: 'a2',
      name: 'Media Rights Group',
      type: 'Licensing',
      description: 'Specializing in licensing creative works across multiple platforms and media.',
      website: 'https://www.mediarights.example',
      email: 'info@mediarights.example',
      phone: '+1 (555) 987-6543',
      connected: false
    },
    {
      id: 'a3',
      name: 'Global Publishing House',
      type: 'Publisher',
      description: 'Major publishing house working with diverse creators worldwide.',
      website: 'https://www.globalpublishing.example',
      email: 'creators@globalpublishing.example',
      phone: '+1 (555) 456-7890',
      connected: false
    }
  ]);
  
  const handleMessageRead = (messageId) => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, unread: false } : msg
    ));
  };
  
  return (
    <div className="network-page">
      <h1 className="text-2xl font-bold mb-6">Your Creative Network</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{messages.length}</p>
            <p className="text-sm text-gray-500">{messages.filter(m => m.unread).length} unread</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Agency Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{agencies.filter(a => a.connected).length}</p>
            <p className="text-sm text-gray-500">Out of {agencies.length} available</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{messages.filter(m => m.type === 'offer').length}</p>
            <p className="text-sm text-gray-500">{messages.filter(m => m.type === 'request').length} licensing requests</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mr-4">
              <TabsList>
                <TabsTrigger value="messages">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="agencies">
                  <Building className="h-4 w-4 mr-2" />
                  Agencies
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
              <Input
                placeholder="Search..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {activeTab === 'messages' ? renderMessages() : renderAgencies()}
        </CardContent>
        
        <CardFooter className="border-t pt-4 text-sm text-gray-500">
          {activeTab === 'messages' ? 
            'Messages are private and only visible to you' : 
            'Connect with agencies to expand your creative opportunities'
          }
        </CardFooter>
      </Card>
    </div>
  );
  
  const handleMessageDelete = (messageId) => {
    setMessages(messages.filter(msg => msg.id !== messageId));
  };
  
  const handleToggleConnection = (agencyId) => {
    setAgencies(agencies.map(agency => 
      agency.id === agencyId ? { ...agency, connected: !agency.connected } : agency
    ));
  };
  
  const filteredMessages = messages.filter(msg => 
    msg.agency.toLowerCase().includes(searchQuery.toLowerCase()) || 
    msg.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredAgencies = agencies.filter(agency => 
    agency.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    agency.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const renderMessages = () => {
    if (filteredMessages.length === 0) {
      return (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Messages</h3>
          <p className="text-gray-500">
            {searchQuery ? 'No messages match your search query' : 'You have no messages from agencies'}
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredMessages.map(msg => (
          <Card key={msg.id} className={msg.unread ? 'border-l-4 border-l-blue-500' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center mb-1">
                    <h3 className="font-medium">{msg.subject}</h3>
                    {msg.unread && (
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">From: {msg.agency}</p>
                  <p className="text-sm mb-2">{msg.message}</p>
                  <p className="text-xs text-gray-500">
                    Received: {new Date(msg.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-1">
                  {msg.unread && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleMessageRead(msg.id)}
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleMessageDelete(msg.id)}
                    title="Delete message"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end mt-2 space-x-2">
                <Button size="sm" variant="outline">
                  <Mail className="h-4 w-4 mr-1" /> Reply
                </Button>
                {msg.type === 'offer' && (
                  <Button size="sm">
                    Connect
                  </Button>
                )}
                {msg.type === 'request' && (
                  <Button size="sm">
                    Review Request
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  const renderAgencies = () => {
    if (filteredAgencies.length === 0) {
      return (
        <div className="text-center py-8">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Agencies Found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'No agencies match your search query' : 'No agencies available in your network'}
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgencies.map(agency => (
          <Card key={agency.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{agency.name}</CardTitle>
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                  {agency.type}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm mb-2">{agency.description}</p>
              <div className="text-sm space-y-1 mb-3">
                <p className="flex items-center">
                  <Mail className="h-3 w-3 mr-2 text-gray-500" />
                  {agency.email}
                </p>
                <p className="flex items-center">
                  <Phone className="h-3 w-3 mr-2 text-gray-500" />
                  {agency.phone}
                </p>
                <p className="flex items-center">
                  <ExternalLink className="h-3 w-3 mr-2 text-gray-500" />
                  <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {agency.website.replace('https://', '')}
                  </a>
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                size="sm" 
                variant={agency.connected ? "outline" : "default"}
                className={agency.connected ? "w-full" : "w-full"}
                onClick={() => handleToggleConnection(agency.id)}
              >
                {agency.connected ? 'Disconnect' : 'Connect & Share Portfolio'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  };
  export default NetworkPage;