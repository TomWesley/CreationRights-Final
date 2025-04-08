// src/components/pages/ChatPage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, User, ArrowLeft, Users, Search } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAppContext } from '../../contexts/AppContext';
import ProfilePhoto from '../shared/ProfilePhoto';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  getUserChats, 
  getChatMessages, 
  sendMessage as sendFirestoreMessage, 
  markAllMessagesAsRead,
  getUnreadMessagesCount
} from '../../services/firestoreChat';
import { getAllUsers } from '../../services/firebase';

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
      if (!currentUser?.email || !chatId) return;
      await markAllMessagesAsRead(chatId, currentUser.email);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [currentUser?.email]);

  // Define fetchChatMessages with useCallback
  const fetchChatMessages = useCallback(async (chatId) => {
    if (!currentUser?.email || !chatId) return;
    
    try {
      console.log(`Fetching messages for chat ${chatId}...`);
      const messages = await getChatMessages(chatId);
      
      console.log(`Fetched ${messages.length} messages for chat ${chatId}`);
      
      // Update the chat with messages
      setChats(prev => 
        prev.map(chat => 
          chat.id === chatId ? { ...chat, messages } : chat
        )
      );
      
      // Mark messages as read
      markMessagesAsRead(chatId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [currentUser?.email, markMessagesAsRead]);

  // Define fetchChats with useCallback
  const fetchChats = useCallback(async () => {
    if (!currentUser?.email) return;
    
    try {
      setLoading(true);
      console.log(`Fetching chats for ${currentUser.email} (UID: ${currentUser.uid})...`);
      
      const userChats = await getUserChats(currentUser.email, currentUser.uid);
      
      console.log(`Fetched ${userChats.length} chats`);
      
      // Log each chat for debugging
      userChats.forEach((chat, index) => {
        console.log(`Chat ${index+1}:`, {
          id: chat.id,
          participants: chat.participants,
          messageCount: chat.messages ? chat.messages.length : 0
        });
      });
      
      setChats(userChats);
      setLoading(false);
      
      // If we have an active chat, fetch its messages
      if (activeChat) {
        const chatExists = userChats.some(chat => chat.id === activeChat);
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
  }, [currentUser?.email, currentUser?.uid, activeChat, fetchChatMessages]);

  // Define fetchAllUsers with useCallback
  const fetchAllUsers = useCallback(async () => {
    if (!currentUser?.email) return;
    
    try {
      const users = await getAllUsers();
      
      // Filter out current user
      const otherUsers = users.filter(user => user.email !== currentUser.email);
      setAllUsers(otherUsers);
      setFilteredUsers(otherUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAllUsers([]);
      setFilteredUsers([]);
    }
  }, [currentUser?.email]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Start or open chat with user
  const startChat = useCallback(async (user) => {
    if (!currentUser?.email) return;
    
    setLoading(true); // Show loading indicator
    
    try {
      console.log("Starting chat with artist:", user.name);
      
      // Check if chat already exists
      const existingChat = chats.find(chat => 
        chat.participants.some(p => p.email === user.email)
      );
      
      if (existingChat) {
        console.log("Using existing chat:", existingChat.id);
        setActiveChat(existingChat.id);
        await fetchChatMessages(existingChat.id);
        updateUrlWithChatId(existingChat.id);
        return;
      }
      
      // Create participant objects with strict validation to avoid undefined values
      const sender = {
        email: currentUser.email || '',
        name: currentUser.name || currentUser.email?.split('@')[0] || 'User',
        uid: currentUser.uid || '',
      };
      
      const recipient = {
        email: user.email || '',
        name: user.name || user.email?.split('@')[0] || 'User',
        uid: user.uid || '',
      };
      
      // Log the participant information to check for any undefined values
      console.log("Chat participants:", { sender, recipient });
      
      // Create new chat - import this from our firestoreChat service
      const { createChat } = await import('../../services/firestoreChat');
      
      const newChat = await createChat([sender, recipient]);
      
      console.log("Chat created with ID:", newChat.id);
      
      // Add messages array to the new chat if not present
      if (!newChat.messages) {
        newChat.messages = [];
      }
      
      // Add the new chat to our state
      setChats(prev => {
        // Check if chat already exists in state to avoid duplicates
        const chatExists = prev.some(c => c.id === newChat.id);
        if (chatExists) {
          return prev;
        }
        return [...prev, newChat];
      });
      
      // Set the active chat and update URL
      setActiveChat(newChat.id);
      updateUrlWithChatId(newChat.id);
      
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat. Please try again. Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [chats, currentUser, fetchChatMessages, updateUrlWithChatId]);

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
      
      // Send to Firestore
      try {
        await sendFirestoreMessage(activeChat, currentUser.email, messageText);
        console.log("Message sent successfully to Firestore");
        
        // Fetch the latest messages to update the UI with the actual message from server
        setTimeout(() => {
          fetchChatMessages(activeChat);
          // Also refresh chats list to update last message
          fetchChats();
        }, 500);
      } catch (firestoreError) {
        console.error('Error sending message to Firestore:', firestoreError);
        
        // Even if Firestore fails, we've already updated the UI with the temp message
        // so the user won't notice a disruption. We could add retry logic here.
        alert('Failed to send message. Please try again.');
        
        // Rollback the optimistic update
        setChats(prev => 
          prev.map(chat => 
            chat.id === activeChat 
              ? { 
                  ...chat, 
                  messages: chat.messages.filter(m => m.id !== tempMessage.id)
                } 
              : chat
          )
        );
        
        // Put the message text back in the input
        setMessage(messageText);
      }
    } catch (error) {
      console.error('Error in sendMessage function:', error);
      alert('Failed to send message. Please try again.');
    }
  }, [activeChat, currentUser?.email, fetchChatMessages, fetchChats, message, scrollToBottom]);

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
  
  // Periodically refresh chats to get new messages
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
  }, [chats, fetchChatMessages]);

  // Get other participant in a chat
  const getOtherParticipant = (chat) => {
    if (!chat || !chat.participants) return { name: 'Unknown' };
    return chat.participants.find(p => p.email !== currentUser?.email) || { name: 'Unknown' };
  };

  // Get unread messages count
  const getUnreadCount = (chat) => {
    if (!chat.messages) return 0;
    return chat.messages.filter(msg => {
      // Message is unread if:
      // 1. Sender is not the current user
      const isFromOther = msg.sender !== currentUser?.email;
      
      // 2. Message is not marked as read OR
      //    readBy array doesn't include current user
      let notReadByUser = true;
      if (msg.readBy && Array.isArray(msg.readBy)) {
        notReadByUser = !msg.readBy.includes(currentUser?.email);
      } else {
        notReadByUser = !msg.read;
      }
      
      return isFromOther && notReadByUser;
    }).length;
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
    if (!currentChat) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading chat...</p>
        </div>
      );
    }
    
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
                key={msg.id || `temp-${Date.now()}-${Math.random()}`} 
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
                    {msg.timestamp ? 
                      new Date(
                        msg.timestamp.seconds ? 
                        msg.timestamp.seconds * 1000 : 
                        msg.timestamp
                      ).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                      ''}
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
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
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