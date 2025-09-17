import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { calculateDistance } from '@/lib/geospatial';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ placeId: string }> }
) {
    try {
        const { placeId } = await params;
        const body = await request.json();
        const { userId, lat, lng } = body;

        if (!userId || !lat || !lng) {
            return NextResponse.json(
                { error: 'User ID and location are required' },
                { status: 400 }
            );
        }

        // Check if place exists
        const placeRef = doc(db, 'places', placeId);
        const placeSnapshot = await getDoc(placeRef);

        if (!placeSnapshot.exists()) {
            return NextResponse.json(
                { error: 'Place not found' },
                { status: 404 }
            );
        }

        const placeData = placeSnapshot.data();

        // Check proximity if place has origin location
        if (placeData.originLocation) {
            const distance = calculateDistance(
                lat,
                lng,
                placeData.originLocation.lat,
                placeData.originLocation.lng
            );

            if (distance > 100) {
                return NextResponse.json(
                    {
                        error: 'You are too far from this place',
                        distance: Math.round(distance)
                    },
                    { status: 400 }
                );
            }
        }

        // Add user to place
        const userRef = doc(db, 'places', placeId, 'users', userId);
        await setDoc(userRef, {
            userId,
            location: { lat, lng },
            joinedAt: serverTimestamp(),
            isOnline: true,
            lastSeen: serverTimestamp()
        });

        return NextResponse.json({
            success: true,
            message: 'Successfully joined place'
        });
    } catch (error) {
        console.error('Error joining place:', error);
        return NextResponse.json(
            { error: 'Failed to join place' },
            { status: 500 }
        );
    }
}
