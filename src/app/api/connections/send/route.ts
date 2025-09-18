import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ConnectionRequest, Connection } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body: ConnectionRequest = await request.json();
        const { fromUserId, toUserId, message } = body;

        if (!fromUserId || !toUserId) {
            return NextResponse.json(
                { error: 'User IDs are required' },
                { status: 400 }
            );
        }

        if (fromUserId === toUserId) {
            return NextResponse.json(
                { error: 'Cannot send connection request to yourself' },
                { status: 400 }
            );
        }

        // Check if connection already exists
        const connectionsRef = collection(db, 'connections');
        const existingConnectionQuery = query(
            connectionsRef,
            where('userId', '==', fromUserId),
            where('connectedUserId', '==', toUserId)
        );

        const existingConnectionSnapshot = await getDocs(existingConnectionQuery);

        if (!existingConnectionSnapshot.empty) {
            return NextResponse.json(
                { error: 'Connection request already exists' },
                { status: 400 }
            );
        }

        // Check if reverse connection exists
        const reverseConnectionQuery = query(
            connectionsRef,
            where('userId', '==', toUserId),
            where('connectedUserId', '==', fromUserId)
        );

        const reverseConnectionSnapshot = await getDocs(reverseConnectionQuery);

        if (!reverseConnectionSnapshot.empty) {
            return NextResponse.json(
                { error: 'Connection already exists between these users' },
                { status: 400 }
            );
        }

        // Create new connection request
        const connectionData = {
            userId: fromUserId,
            connectedUserId: toUserId,
            status: 'pending',
            message: message || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(connectionsRef, connectionData);

        const connection: Connection = {
            id: docRef.id,
            userId: fromUserId,
            connectedUserId: toUserId,
            status: 'pending',
            message: message || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        return NextResponse.json(connection);
    } catch (error) {
        console.error('Error sending connection request:', error);
        return NextResponse.json(
            { error: 'Failed to send connection request' },
            { status: 500 }
        );
    }
}
