import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { UserConnection, Connection, User } from '@/types';
import userProfileService from '@/lib/userProfileService';

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

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

        // Get accepted connections for this user using the users array
        const connectionsRef = collection(db, 'connections');
        const acceptedQuery = query(
            connectionsRef,
            where('users', 'array-contains', userId),
            where('status', '==', 'accepted'),
            orderBy('createdAt', 'desc')
        );

        const acceptedSnapshot = await getDocs(acceptedQuery);

        const userConnections: UserConnection[] = [];

        // Process all accepted connections
        for (const doc of acceptedSnapshot.docs) {
            const connectionData = doc.data();
            const connection: Connection = {
                id: doc.id,
                userId: connectionData.userId,
                connectedUserId: connectionData.connectedUserId,
                status: connectionData.status,
                message: connectionData.message || '',
                createdAt: connectionData.createdAt?.toDate() || new Date(),
                updatedAt: connectionData.updatedAt?.toDate() || new Date(),
                users: connectionData.users || [connectionData.userId, connectionData.connectedUserId]
            };

            // Determine which user is the "other" user (not the current user)
            const otherUserId = connection.userId === userId ? connection.connectedUserId : connection.userId;
            const isIncoming = connection.connectedUserId === userId;

            // Get user profile for the other user
            try {
                const userProfile = await userProfileService.getUserProfile(otherUserId);
                if (userProfile) {
                    const user: User = userProfileService.convertToUser(
                        userProfile,
                        { lat: 0, lng: 0 }, // Location not needed for connection list
                        0
                    );

                    userConnections.push({
                        user,
                        connection,
                        isIncoming
                    });
                } else {
                    console.warn(`User profile not found for otherUserId: ${otherUserId}`);
                }
            } catch (error) {
                console.error(`Error fetching user profile for otherUserId: ${otherUserId}`, error);
            }
        }

        // Sort by creation date (newest first)
        userConnections.sort((a, b) =>
            b.connection.createdAt.getTime() - a.connection.createdAt.getTime()
        );

        return NextResponse.json(userConnections, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    } catch (error) {
        console.error('Error fetching accepted connections:', error);
        return NextResponse.json(
            { error: 'Failed to fetch accepted connections' },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            }
        );
    }
}
