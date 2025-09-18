import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ connectionId: string }> }
) {
    try {
        const { connectionId } = await params;

        if (!connectionId) {
            return NextResponse.json(
                { error: 'Connection ID is required' },
                { status: 400 }
            );
        }

        // Check if connection exists
        const connectionRef = doc(db, 'connections', connectionId);
        const connectionSnapshot = await getDoc(connectionRef);

        if (!connectionSnapshot.exists()) {
            return NextResponse.json(
                { error: 'Connection not found' },
                { status: 404 }
            );
        }

        // Delete the connection
        await deleteDoc(connectionRef);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing connection:', error);
        return NextResponse.json(
            { error: 'Failed to remove connection' },
            { status: 500 }
        );
    }
}
