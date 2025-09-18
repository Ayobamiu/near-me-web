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

        // Get accepted connections for this user (both sent and received)
        const connectionsRef = collection(db, 'connections');
        const sentAcceptedQuery = query(
            connectionsRef,
            where('userId', '==', userId),
            where('status', '==', 'accepted'),
            orderBy('createdAt', 'desc')
        );

        const receivedAcceptedQuery = query(
            connectionsRef,
            where('connectedUserId', '==', userId),
            where('status', '==', 'accepted'),
            orderBy('createdAt', 'desc')
        );

        const [sentAcceptedSnapshot, receivedAcceptedSnapshot] = await Promise.all([
            getDocs(sentAcceptedQuery),
            getDocs(receivedAcceptedQuery)
        ]);

        const userConnections: UserConnection[] = [];

        // Process sent accepted connections
        for (const doc of sentAcceptedSnapshot.docs) {
            const connectionData = doc.data();
            const connection: Connection = {
                id: doc.id,
                userId: connectionData.userId,
                connectedUserId: connectionData.connectedUserId,
                status: connectionData.status,
                message: connectionData.message || '',
                createdAt: connectionData.createdAt?.toDate() || new Date(),
                updatedAt: connectionData.updatedAt?.toDate() || new Date()
            };

            // Get user profile for the connected user
            const userProfile = await userProfileService.getUserProfile(connection.connectedUserId);
            if (userProfile) {
                const user: User = userProfileService.convertToUser(
                    userProfile,
                    { lat: 0, lng: 0 }, // Location not needed for connection list
                    0
                );

                userConnections.push({
                    user,
                    connection,
                    isIncoming: false
                });
            }
        }

        // Process received accepted connections
        for (const doc of receivedAcceptedSnapshot.docs) {
            const connectionData = doc.data();
            const connection: Connection = {
                id: doc.id,
                userId: connectionData.userId,
                connectedUserId: connectionData.connectedUserId,
                status: connectionData.status,
                message: connectionData.message || '',
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

        // Sort by creation date (newest first)
        userConnections.sort((a, b) =>
            b.connection.createdAt.getTime() - a.connection.createdAt.getTime()
        );

        return NextResponse.json(userConnections);
    } catch (error) {
        console.error('Error fetching accepted connections:', error);
        return NextResponse.json(
            { error: 'Failed to fetch accepted connections' },
            { status: 500 }
        );
    }
}
