import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { UserConnection, Connection, User } from '@/types';
import userProfileService from '@/lib/userProfileService';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Get pending connections received by this user
        const connectionsRef = collection(db, 'connections');
        const pendingConnectionsQuery = query(
            connectionsRef,
            where('connectedUserId', '==', userId),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );

        const pendingConnectionsSnapshot = await getDocs(pendingConnectionsQuery);
        const userConnections: UserConnection[] = [];

        for (const doc of pendingConnectionsSnapshot.docs) {
            const connectionData = doc.data();
            const connection: Connection = {
                id: doc.id,
                userId: connectionData.userId,
                connectedUserId: connectionData.connectedUserId,
                status: connectionData.status,
                message: connectionData.message || '',
                users: connectionData.users || [connectionData.userId, connectionData.connectedUserId],
                createdAt: connectionData.createdAt?.toDate() || new Date(),
                updatedAt: connectionData.updatedAt?.toDate() || new Date()
            };

            // Get user profile for the user who sent the request
            const userProfile = await userProfileService.getUserProfile(connection.userId);
            if (userProfile) {
                const user: User = userProfileService.convertToUser(
                    userProfile,
                    { lat: 0, lng: 0 }, // Location not needed for connection list
                    0
                );

                userConnections.push({
                    user,
                    connection,
                    isIncoming: true
                });
            }
        }

        return NextResponse.json(userConnections);
    } catch (error) {
        console.error('Error fetching pending connections:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pending connections' },
            { status: 500 }
        );
    }
}
