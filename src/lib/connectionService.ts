import {
    Connection,
    ConnectionRequest,
    UserConnection
} from '@/types';

const API_BASE = '/api';

class ConnectionService {
    // Send a connection request
    async sendConnectionRequest(request: ConnectionRequest): Promise<Connection> {
        const response = await fetch(`${API_BASE}/connections/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send connection request');
        }

        return response.json();
    }

    // Accept a connection request
    async acceptConnection(connectionId: string): Promise<Connection> {
        const response = await fetch(`${API_BASE}/connections/${connectionId}/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to accept connection');
        }

        return response.json();
    }

    // Reject a connection request
    async rejectConnection(connectionId: string): Promise<Connection> {
        const response = await fetch(`${API_BASE}/connections/${connectionId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to reject connection');
        }

        return response.json();
    }

    // Get all connections for a user (pending, accepted, rejected)
    async getUserConnections(userId: string): Promise<UserConnection[]> {
        const response = await fetch(`${API_BASE}/connections/user/${userId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch connections');
        }

        return response.json();
    }

    // Get pending connection requests for a user
    async getPendingConnections(userId: string): Promise<UserConnection[]> {
        const response = await fetch(`${API_BASE}/connections/user/${userId}/pending`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch pending connections');
        }

        return response.json();
    }

    // Get accepted connections for a user
    async getAcceptedConnections(userId: string): Promise<UserConnection[]> {
        const response = await fetch(`${API_BASE}/connections/user/${userId}/accepted`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch accepted connections');
        }

        return response.json();
    }

    // Check if two users are connected
    async areUsersConnected(userId1: string, userId2: string): Promise<boolean> {
        const response = await fetch(`${API_BASE}/connections/check/${userId1}/${userId2}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to check connection status');
        }

        const result = await response.json();
        return result.connected;
    }

    // Get connection status between two users
    async getConnectionStatus(userId1: string, userId2: string): Promise<Connection | null> {
        const response = await fetch(`${API_BASE}/connections/status/${userId1}/${userId2}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get connection status');
        }

        const result = await response.json();
        return result.connection;
    }

    // Remove/Unfriend a connection
    async removeConnection(connectionId: string): Promise<void> {
        const response = await fetch(`${API_BASE}/connections/${connectionId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to remove connection');
        }
    }
}

const connectionService = new ConnectionService();
export default connectionService;
