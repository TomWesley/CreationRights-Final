// src/components/pages/ChatPage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, User, ArrowLeft, Users, Search } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAppContext } from '../../contexts/AppContext';
import ProfilePhoto from '../shared/ProfilePhoto';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

const ChatPage = () => {
  const { currentUser, setActiveView } = useAppContext();
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

  // Function to update URL with chat ID for direct linking
  const updateUrlWithChatId = useCallback((chatId) => {
    if (window.history && window.history.pushState) {
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('chatId', chatId);
      window.history.pushState({}, '', newUrl);
    }
  }, []);

  // Define markMessagesAsRead with useCallback
  const markMessagesAsRead = useCallback(async (chatId) => {
    try {
      await fetch(`${API_URL}/api/chats/${currentUser.email}/${chatId}/read`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [API_URL, currentUser?.email]);

  // Define fetchChatMessages with useCallback
  const fetchChatMessages = useCallback(async (chatId) => {
    if (!currentUser?.email) return;
    
    try {
      console.log(`Fetching messages for chat ${chatId}...`);
      const response = await fetch(`${API_URL}/api/chats/${currentUser.email}/${chatId}/messages`);
      
      if (!response.ok) {
        console.error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.length} messages for chat ${chatId}`);
      
      // Update the chat with messages
      setChats(prev => 
        prev.map(chat => 
          chat.id === chatId ? { ...chat, messages: data } : chat
        )
      );
      
      // Mark messages as read
      markMessagesAsRead(chatId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [API_URL, currentUser?.email, markMessagesAsRead]);

  // Define fetchChats with useCallback
  const fetchChats = useCallback(async () => {
    if (!currentUser?.email) return;
    
    try {
      setLoading(true);
      console.log(`Fetching chats for ${currentUser.email}...`);
      
      const response = await fetch(`${API_URL}/api/chats/${currentUser.email}`);
      
      if (!response.ok) {
        console.error(`Failed to fetch chats: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        throw new Error('Failed to fetch chats');
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.length} chats`);
      
      // Log each chat for debugging
      data.forEach((chat, index) => {
        console.log(`Chat ${index+1}:`, {
          id: chat.id,
          participants: chat.participants,
          messageCount: chat.messages ? chat.messages.length : 0
        });
      });
      
      setChats(data);
      setLoading(false);
      
      // If we have an active chat, fetch its messages
      if (activeChat) {
        const chatExists = data.some(chat => chat.id === activeChat);
        if (chatExists) {
          fetchChatMessages(activeChat);
        } else {
          setActiveChat(null);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setLoading(false);
      // Initialize with empty array if first time
      setChats([]);
    }
  }, [API_URL, currentUser?.email, activeChat, fetchChatMessages]);

  // Define fetchAllUsers with useCallback
  const fetchAllUsers = useCallback(async () => {
    if (!currentUser?.email) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      
      // Filter out current user
      const otherUsers = data.filter(user => user.email !== currentUser.email);
      setAllUsers(otherUsers);
      setFilteredUsers(otherUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAllUsers([]);
      setFilteredUsers([]);
    }
  }, [API_URL, currentUser?.email]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Start or open chat with user
  const startChat = useCallback(async (user) => {
    if (!currentUser?.email) return;
    
    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.participants.some(p => p.email === user.email)
    );
    
    if (existingChat) {
      setActiveChat(existingChat.id);
      setActiveTab('chats');
      fetchChatMessages(existingChat.id);
      updateUrlWithChatId(existingChat.id);
      return;
    }
    
    // Create new chat
    try {
      const response = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participants: [
            { email: currentUser.email, name: currentUser.name || currentUser.email },
            { email: user.email, name: user.name || user.email }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create chat');
      }
      
      const newChat = await response.json();
      setChats(prev => [...prev, newChat]);
      setActiveChat(newChat.id);
      setActiveTab('chats');
      
      // Update URL with chatId (for direct linking)
      updateUrlWithChatId(newChat.id);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  }, [API_URL, chats, currentUser?.email, currentUser?.name, fetchChatMessages, setActiveTab, updateUrlWithChatId]);

  // Send a message
  const sendMessage = useCallback(async () => {
    if (!message.trim() || !activeChat || !currentUser?.email) return;
    
    try {
      console.log(`Sending message to chat ${activeChat}...`);
      const messageText = message.trim();
      const timestamp = new Date().toISOString();
      
      // Update local state immediately for responsive UX
      const tempMessage = {
        id: `temp-${Date.now()}`,
        sender: currentUser.email,
        content: messageText,
        timestamp: timestamp,
        read: true
      };
      
      setChats(prev => 
        prev.map(chat => 
          chat.id === activeChat 
            ? { 
                ...chat, 
                messages: [...(chat.messages || []), tempMessage],
                lastMessage: messageText,
                lastMessageTime: timestamp
              } 
            : chat
        )
      );
      
      // Clear message input
      setMessage('');
      
      // Scroll to bottom immediately
      setTimeout(scrollToBottom, 50);
      
      // Send to server
      const response = await fetch(`${API_URL}/api/chats/${activeChat}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: currentUser.email,
          content: messageText,
          timestamp: timestamp
        })
      });
      
      if (!response.ok) {
        console.error(`Failed to send message: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        throw new Error('Failed to send message');
      }
      
      const sentMessage = await response.json();
      console.log(`Message sent successfully with ID: ${sentMessage.id}`);
      
      // Fetch the latest messages to update the UI with the actual message from server
      setTimeout(() => {
        fetchChatMessages(activeChat);
        // Also refresh chats list to update last message
        fetchChats();
      }, 500);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  }, [API_URL, activeChat, currentUser?.email, fetchChatMessages, fetchChats, message, scrollToBottom]);

  // Load chats and users when component mounts
  useEffect(() => {
    if (currentUser?.email) {
      fetchChats();
      fetchAllUsers();
    }
  }, [currentUser, fetchChats, fetchAllUsers]);

  // Filter users when search query changes
  useEffect(() => {
    if (userSearchQuery.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const query = userSearchQuery.toLowerCase();
      const filtered = allUsers.filter(user => 
        user.name?.toLowerCase().includes(query) || 
        user.email?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [userSearchQuery, allUsers]);

  // Scroll to bottom of messages when new ones come in
  useEffect(() => {
    scrollToBottom();
  }, [activeChat, scrollToBottom]);
  
  // Periodically refresh chats and active chat messages
  useEffect(() => {
    if (!currentUser?.email) return;
    
    const refreshInterval = setInterval(() => {
      fetchChats();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(refreshInterval);
  }, [currentUser, fetchChats]);

  // Check URL for chat ID on initial load
  useEffect(() => {
    if (chats.length > 0) {
      // First check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const urlChatId = urlParams.get('chatId');
      
      // Then check sessionStorage (this is set by ArtistsList component)
      const storedChatId = sessionStorage.getItem('activeChat');
      
      // Use URL parameter first, then fallback to sessionStorage
      const chatId = urlChatId || storedChatId;
      
      console.log("Initializing ChatPage with potential chatId:", chatId);
      
      if (chatId) {
        const chatExists = chats.some(chat => chat.id === chatId);
        
        if (chatExists) {
          console.log("Found matching chat, activating:", chatId);
          setActiveChat(chatId);
          fetchChatMessages(chatId);
          setActiveTab('chats');
          
          // Update URL if it doesn't already have the chatId
          if (!urlChatId && window.history && window.history.pushState) {
            window.history.pushState({ chatId }, '', `?chatId=${chatId}`);
          }
          
          // Clear sessionStorage after use
          if (storedChatId) {
            sessionStorage.removeItem('activeChat');
          }
        } else {
          console.log("Chat ID not found in available chats:", chatId);
        }
      }
    }
  }, [chats, fetchChatMessages, setActiveTab]);

  // Get other participant in a chat
  const getOtherParticipant = (chat) => {
    if (!chat || !chat.participants) return { name: 'Unknown' };
    return chat.participants.find(p => p.email !== currentUser?.email) || { name: 'Unknown' };
  };

  // Get unread messages count
  const getUnreadCount = (chat) => {
    if (!chat.messages) return 0;
    return chat.messages.filter(msg => !msg.read && msg.sender !== currentUser?.email).length;
  };

  // Render chat list
  const renderChatList = () => {
    if (loading && chats.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading chats...</p>
        </div>
      );
    }

    if (chats.length === 0) {
      return (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Conversations Yet</h3>
          <p className="text-gray-500 mb-4">
            Start a conversation by selecting a user from the Users tab
          </p>
          <Button 
            onClick={() => setActiveTab('users')}
            variant="outline"
          >
            Browse Users
          </Button>
        </div>
      );
    }

    return (
      <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
        {chats.map(chat => {
          const otherParticipant = getOtherParticipant(chat);
          const unreadCount = getUnreadCount(chat);
          
          return (
            <div 
              key={chat.id} 
              className={`p-3 cursor-pointer border-b hover:bg-gray-50 ${activeChat === chat.id ? 'bg-blue-50' : ''}`}
              onClick={() => {
                setActiveChat(chat.id);
                fetchChatMessages(chat.id);
                // Update URL with chatId for direct linking
                updateUrlWithChatId(chat.id);
              }}
            >
              <div className="flex items-center">
                <div className="mr-3">
                  <ProfilePhoto 
                    email={otherParticipant.email}
                    name={otherParticipant.name}
                    size="md"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{otherParticipant.name}</h3>
                    {chat.lastMessageTime && (
                      <span className="text-xs text-gray-500">
                        {new Date(chat.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 truncate w-40">
                      {chat.lastMessage || 'Start a conversation'}
                    </p>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-blue-500 text-white px-2 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render all users
  const renderUsersList = () => {
    if (allUsers.length === 0) {
      return (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Users Found</h3>
          <p className="text-gray-500">
            There are no other users in the system yet
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
        {filteredUsers.map(user => (
          <div 
            key={user.email} 
            className="p-3 cursor-pointer border-b hover:bg-gray-50"
            onClick={() => startChat(user)}
          >
            <div className="flex items-center">
              <div className="mr-3">
                <ProfilePhoto 
                  email={user.email}
                  name={user.name}
                  size="md"
                />
              </div>
              <div className="flex-grow">
                <h3 className="font-medium">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.specialties && user.specialties.length > 0 && (
                  <div className="flex flex-wrap mt-1 gap-1">
                    {user.specialties.slice(0, 2).map((specialty, index) => (
                      <span 
                        key={index}
                        className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded"
                      >
                        {specialty}
                      </span>
                    ))}
                    {user.specialties.length > 2 && (
                      <span className="text-xs text-gray-500">+{user.specialties.length - 2} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render chat messages
  const renderChatMessages = () => {
    if (!activeChat) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Select a chat or start a new conversation</p>
        </div>
      );
    }

    const currentChat = chats.find(c => c.id === activeChat);
    if (!currentChat) return null;
    
    const otherParticipant = getOtherParticipant(currentChat);
    const messages = currentChat.messages || [];

    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-3 flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden mr-2"
            onClick={() => setActiveChat(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center">
            <ProfilePhoto 
              email={otherParticipant.email}
              name={otherParticipant.name}
              size="sm"
            />
            <span className="ml-2 font-medium">{otherParticipant.name}</span>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === currentUser?.email ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs md:max-w-md px-3 py-2 rounded-lg ${
                    msg.sender === currentUser?.email ? 
                    'bg-blue-500 text-white' : 
                    'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p>{msg.content}</p>
                  <div className={`text-xs mt-1 ${msg.sender === currentUser?.email ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t p-3">
          <div className="flex">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-grow"
            />
            <Button 
              onClick={sendMessage} 
              className="ml-2"
              disabled={!message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-page">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            console.log("Navigating back to dashboard");
            setActiveView('dashboard');
          }}
        >
          Back to Dashboard
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`md:block ${activeChat ? 'hidden' : 'block'}`}>
          <Card className="h-[calc(100vh-200px)]">
            <CardHeader className="pb-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="chats" className="flex-1">Conversations</TabsTrigger>
                  <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {activeTab === 'users' && (
                <div className="mt-2 relative">
                  <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              )}
            </CardHeader>
            
            <CardContent className="p-0">
              {activeTab === 'chats' ? renderChatList() : renderUsersList()}
            </CardContent>
          </Card>
        </div>
        
        <div className={`md:col-span-2 ${activeChat ? 'block' : 'hidden md:block'}`}>
          <Card className="h-[calc(100vh-200px)]">
            <CardContent className="p-0 h-full">
              {renderChatMessages()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;