import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(
    request: NextRequest,
    { params }: { params: { placeId: string } }
) {
    try {
        const { placeId } = params;
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Mark user as offline
        const userRef = doc(db, 'places', placeId, 'users', userId);
        await updateDoc(userRef, {
            isOnline: false,
            leftAt: serverTimestamp()
        });

        return NextResponse.json({
            success: true,
            message: 'Successfully left place'
        });
    } catch (error) {
        console.error('Error leaving place:', error);
        return NextResponse.json(
            { error: 'Failed to leave place' },
            { status: 500 }
        );
    }
}
