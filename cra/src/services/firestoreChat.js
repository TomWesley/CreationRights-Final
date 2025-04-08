// src/services/firestoreChat.js
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    arrayUnion
  } from 'firebase/firestore';
  import { db } from './firebase'; // Import Firestore db from firebase.js
  
  /**
   * Create a new chat between users
   * @param {Array} participants - Array of participant objects with email, name, and uid
   * @returns {Promise<Object>} - The created chat document
   */
  export const createChat = async (participants) => {
    try {
      if (!participants || participants.length < 2) {
        throw new Error('At least two participants are required');
      }
  
      // Sanitize participant data to avoid undefined values
      const sanitizedParticipants = participants.map(p => ({
        email: p.email || '',
        name: p.name || (p.email ? p.email.split('@')[0] : 'User'),
        uid: p.uid || ''
      }));
  
      // Log what we're about to send to Firestore
      console.log('Creating chat with sanitized participants:', JSON.stringify(sanitizedParticipants, null, 2));
  
      // Check if chat already exists between these participants
      const existingChat = await findExistingChat(sanitizedParticipants);
      if (existingChat) {
        console.log('Chat already exists, returning existing chat:', existingChat.id);
        return existingChat;
      }
  
      // Extract emails and UIDs for more efficient queries
      const participantEmails = sanitizedParticipants.map(p => p.email.toLowerCase());
      const participantUIDs = sanitizedParticipants.map(p => p.uid).filter(Boolean); // Filter out empty UIDs
  
      // Create a new chat document with additional metadata to help with security rules
      const chatData = {
        participants: sanitizedParticipants,
        participantUIDs: participantUIDs.length > 0 ? participantUIDs : ['unknown'], // Fallback value for security rules
        participantEmails: participantEmails,
        created: serverTimestamp(),
        lastMessage: '',
        lastMessageTime: null,
        createdBy: sanitizedParticipants[0].uid || sanitizedParticipants[0].email || 'unknown',
        createdAt: serverTimestamp()
      };
  
      console.log('Creating new chat with data:', JSON.stringify(chatData, null, 2));
  
      // Add to chats collection
      const chatRef = await addDoc(collection(db, 'chats'), chatData);
      const chatId = chatRef.id;
      
      // Get the document with the ID
      const chatDoc = await getDoc(chatRef);
      
      const result = {
        id: chatId,
        ...chatDoc.data()
      };
      
      console.log('Chat created successfully:', result);
      
      // Return the chat data including the ID
      return result;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  };
  
  /**
   * Find an existing chat between participants
   * @param {Array} participants - Array of participant objects
   * @returns {Promise<Object|null>} - The existing chat or null
   */
  export const findExistingChat = async (participants) => {
    try {
      // Ensure we have valid participant data
      if (!participants || !Array.isArray(participants) || participants.length < 2) {
        console.error('Invalid participants data provided to findExistingChat');
        return null;
      }
      
      // Extract emails and UIDs for querying and comparison
      const participantEmails = participants.map(p => (p.email || '').toLowerCase()).filter(Boolean);
      const participantUIDs = participants.map(p => p.uid || '').filter(Boolean);
      
      // If we don't have valid emails or UIDs, we can't search
      if (participantEmails.length === 0 && participantUIDs.length === 0) {
        console.error('No valid emails or UIDs found in participants');
        return null;
      }
      
      console.log('Looking for existing chat with participants:', 
        { emails: participantEmails, uids: participantUIDs });
      
      // Query chats more efficiently using array-contains query
      const chatsRef = collection(db, 'chats');
      let querySnapshot;
      
      try {
        // Try searching by the first participant's UID if available
        if (participantUIDs.length > 0) {
          console.log(`Querying by first UID: ${participantUIDs[0]}`);
          const q = query(
            chatsRef, 
            where('participantUIDs', 'array-contains', participantUIDs[0])
          );
          querySnapshot = await getDocs(q);
        } else if (participantEmails.length > 0) {
          // Fallback to query by email
          console.log(`Querying by first email: ${participantEmails[0]}`);
          const q = query(
            chatsRef, 
            where('participantEmails', 'array-contains', participantEmails[0])
          );
          querySnapshot = await getDocs(q);
        } else {
          // If we get here, we can't search effectively
          console.error('No valid search criteria available');
          return null;
        }
      } catch (queryError) {
        console.error('Error querying Firestore:', queryError);
        // If query fails, try fetching all chats
        querySnapshot = await getDocs(chatsRef);
      }
      
      console.log(`Found ${querySnapshot.size} potential matching chats`);
      
      // Find a chat with the exact same participants
      for (const chatDoc of querySnapshot.docs) {
        const chatData = chatDoc.data();
        
        // Skip if the chat doesn't have participants
        if (!chatData.participants || !Array.isArray(chatData.participants)) {
          continue;
        }
        
        // Extract emails from chat participants - with error handling
        const chatParticipantEmails = chatData.participants
          .map(p => {
            if (!p || !p.email) return '';
            return p.email.toLowerCase();
          })
          .filter(Boolean); // Remove empty entries
        
        // If we don't have enough valid emails, this is not a match
        if (chatParticipantEmails.length !== participantEmails.length) {
          continue;
        }
        
        // Check if all participants exist in the chat
        const allParticipantsExist = participantEmails.every(email => 
          chatParticipantEmails.includes(email)
        );
        
        if (allParticipantsExist) {
          console.log(`Found existing chat: ${chatDoc.id}`);
          return {
            id: chatDoc.id,
            ...chatData
          };
        }
      }
      
      console.log('No existing chat found');
      return null;
    } catch (error) {
      console.error('Error finding existing chat:', error);
      return null;
    }
  };
  
  /**
   * Get all chats for a user
   * @param {string} userEmail - User's email
   * @param {string} [userUID] - Optional user UID for more efficient queries
   * @returns {Promise<Array>} - Array of chat objects
   */
  export const getUserChats = async (userEmail, userUID = null) => {
    try {
      if (!userEmail) return [];
      
      const userEmailLower = userEmail.toLowerCase();
      
      console.log(`Getting chats for user: ${userEmailLower} (UID: ${userUID || 'not provided'})`);
      
      // Create a query for chats where the user is a participant
      const chatsRef = collection(db, 'chats');
      let querySnapshot;
      
      if (userUID) {
        // Use more efficient query with UID if available
        const q = query(
          chatsRef, 
          where('participantUIDs', 'array-contains', userUID)
        );
        querySnapshot = await getDocs(q);
      } else {
        // Fall back to email-based query
        const q = query(
          chatsRef, 
          where('participantEmails', 'array-contains', userEmailLower)
        );
        querySnapshot = await getDocs(q);
      }
      
      console.log(`Found ${querySnapshot.size} chats for user`);
      
      const userChats = [];
      
      // Process each chat document
      for (const chatDoc of querySnapshot.docs) {
        const chatData = chatDoc.data();
        
        // Double-check that the user is a participant (for backward compatibility)
        if (chatData.participants && Array.isArray(chatData.participants)) {
          const isParticipant = chatData.participants.some(
            p => p.email && p.email.toLowerCase() === userEmailLower
          );
          
          if (isParticipant) {
            // Get messages for this chat
            const messages = await getChatMessages(chatDoc.id);
            
            // Construct chat object
            const chat = {
              id: chatDoc.id,
              ...chatData,
              messages
            };
            
            userChats.push(chat);
          }
        }
      }
      
      // Sort chats by last message time (most recent first)
      userChats.sort((a, b) => {
        const timeA = a.lastMessageTime ? 
          (a.lastMessageTime.seconds ? a.lastMessageTime.seconds * 1000 : new Date(a.lastMessageTime).getTime()) : 0;
        const timeB = b.lastMessageTime ? 
          (b.lastMessageTime.seconds ? b.lastMessageTime.seconds * 1000 : new Date(b.lastMessageTime).getTime()) : 0;
        return timeB - timeA;
      });
      
      return userChats;
    } catch (error) {
      console.error('Error getting user chats:', error);
      return [];
    }
  };
  
  /**
   * Get messages for a specific chat
   * @param {string} chatId - Chat ID
   * @returns {Promise<Array>} - Array of message objects
   */
  export const getChatMessages = async (chatId) => {
    try {
      if (!chatId) {
        console.error('Cannot get messages: No chat ID provided');
        return [];
      }
      
      console.log(`Getting messages for chat ${chatId}...`);
      
      // First, check if the chat exists
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        console.error(`Chat with ID ${chatId} not found`);
        return [];
      }
      
      // Get messages sorted by timestamp
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      const querySnapshot = await getDocs(q);
      
      console.log(`Found ${querySnapshot.size} messages for chat ${chatId}`);
      
      const messages = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Format the timestamp - Handle both server timestamps and string timestamps
        let formattedTimestamp = data.timestamp;
        if (data.timestamp && data.timestamp.toDate) {
          // Convert Firestore timestamp to JS Date
          formattedTimestamp = data.timestamp.toDate();
        }
        
        messages.push({
          id: doc.id,
          ...data,
          timestamp: formattedTimestamp
        });
      });
      
      return messages;
    } catch (error) {
      console.error(`Error getting messages for chat ${chatId}:`, error);
      return [];
    }
  };
  
  /**
   * Send a message in a chat
   * @param {string} chatId - Chat ID
   * @param {string} sender - Sender's email
   * @param {string} content - Message content
   * @returns {Promise<Object>} - The sent message
   */
  export const sendMessage = async (chatId, sender, content) => {
    try {
      if (!chatId || !sender || !content) {
        throw new Error('Chat ID, sender, and content are required');
      }
      
      console.log(`Sending message to chat ${chatId} from ${sender}`);
      
      // First check if the chat exists
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }
      
      // Create message object
      const messageData = {
        sender,
        content,
        timestamp: serverTimestamp(),
        read: false,
        readBy: [sender] // Initialize with sender as having read the message
      };
      
      console.log(`Adding message to chat ${chatId}...`, messageData);
      
      // Add message to the chat's messages subcollection
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messageRef = await addDoc(messagesRef, messageData);
      console.log(`Message added with ID: ${messageRef.id}`);
      
      // Also update the chat document with the last message info
      await updateDoc(chatRef, {
        lastMessage: content,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`Updated chat ${chatId} with last message info`);
      
      // Get the complete message with ID
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        console.error(`Message with ID ${messageRef.id} not found after creation`);
        throw new Error('Failed to retrieve created message');
      }
      
      const messageWithId = {
        id: messageRef.id,
        ...messageDoc.data()
      };
      
      console.log(`Returning message with ID: ${messageRef.id}`);
      return messageWithId;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
  
  /**
   * Mark a message as read for a specific user
   * @param {string} chatId - Chat ID
   * @param {string} messageId - Message ID
   * @param {string} userEmail - User's email
   * @returns {Promise<void>}
   */
  export const markAsRead = async (chatId, messageId, userEmail) => {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      
      // Get current message data
      const messageSnap = await getDoc(messageRef);
      if (!messageSnap.exists()) {
        throw new Error('Message not found');
      }
      
      const messageData = messageSnap.data();
      
      // If sender is the current user, it's already read
      if (messageData.sender === userEmail) {
        return;
      }
      
      // Track who has read this message
      if (!messageData.readBy) {
        messageData.readBy = [];
      }
      
      // Check if user has already read the message
      if (!messageData.readBy.includes(userEmail)) {
        await updateDoc(messageRef, {
          readBy: arrayUnion(userEmail),
          read: true // For backward compatibility
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  /**
   * Mark all messages in a chat as read for a user
   * @param {string} chatId - Chat ID
   * @param {string} userEmail - User's email
   * @returns {Promise<void>}
   */
  export const markAllMessagesAsRead = async (chatId, userEmail) => {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(
        messagesRef, 
        where('sender', '!=', userEmail),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      
      const updatePromises = [];
      querySnapshot.forEach((doc) => {
        const messageRef = doc.ref;
        const messageData = doc.data();
        
        // Skip if already read by this user
        if (messageData.readBy && messageData.readBy.includes(userEmail)) {
          return;
        }
        
        updatePromises.push(
          updateDoc(messageRef, {
            readBy: arrayUnion(userEmail),
            read: true
          })
        );
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error(`Error marking all messages as read in chat ${chatId}:`, error);
    }
  };
  
  /**
   * Get unread messages count for a user
   * @param {string} userEmail - User's email
   * @returns {Promise<number>} - Number of unread messages
   */
  export const getUnreadMessagesCount = async (userEmail) => {
    try {
      const chats = await getUserChats(userEmail);
      let unreadCount = 0;
      
      for (const chat of chats) {
        if (chat.messages) {
          for (const message of chat.messages) {
            // Message is unread if sender is not the user and user hasn't read it
            const isFromOther = message.sender !== userEmail;
            const isUnread = !message.read;
            
            // Check the readBy array if available
            let notReadByUser = true;
            if (message.readBy && Array.isArray(message.readBy)) {
              notReadByUser = !message.readBy.includes(userEmail);
            }
            
            if (isFromOther && isUnread && notReadByUser) {
              unreadCount++;
            }
          }
        }
      }
      
      return unreadCount;
    } catch (error) {
      console.error('Error getting unread messages count:', error);
      return 0;
    }
  };