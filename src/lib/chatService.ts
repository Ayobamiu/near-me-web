import {
    Message,
    ChatMessage,
    SendMessageRequest
} from '@/types';

const API_BASE = '/api';

const chatService = {
    // Send a message to a user
    sendMessage: async (request: SendMessageRequest): Promise<{ success: boolean; messageId: string }> => {
        const response = await fetch(`${API_BASE}/chat/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send message');
        }

        return response.json();
    },

    // Generate conversation ID between two users
    getConversationId: (userId1: string, userId2: string): string => {
        return [userId1, userId2].sort().join('_');
    },

    // Get messages for a conversation
    getMessages: async (conversationId: string, limit: number = 50, lastMessageId?: string, userId?: string): Promise<ChatMessage[]> => {
        const params = new URLSearchParams({
            limit: limit.toString(),
            ...(lastMessageId && { lastMessageId })
        });

        const headers: HeadersInit = {};
        if (userId) {
            headers['x-user-id'] = userId;
        }

        const response = await fetch(`${API_BASE}/chat/conversation/${conversationId}/messages?${params}`, {
            headers
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get messages');
        }
        return response.json();
    },

    // Note: getConversations method removed - use connections + messages directly

    // Mark messages as read
    markMessagesAsRead: async (conversationId: string, userId: string): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE}/chat/conversation/${conversationId}/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to mark messages as read');
        }
        return response.json();
    },

    // Delete a message
    deleteMessage: async (messageId: string): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE}/chat/message/${messageId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete message');
        }
        return response.json();
    },

    // Edit a message
    editMessage: async (messageId: string, newContent: string): Promise<Message> => {
        const response = await fetch(`${API_BASE}/chat/message/${messageId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newContent }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to edit message');
        }
        return response.json();
    },

    // Get unread message count for a user
    getUnreadCount: async (userId: string): Promise<number> => {
        const response = await fetch(`${API_BASE}/chat/user/${userId}/unread-count`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get unread count');
        }
        const data = await response.json();
        return data.count;
    }
};

export default chatService;
