import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { placeId, name, qrCode, lat, lng, createdBy } = body;

        if (!placeId || !name || !qrCode || !lat || !lng || !createdBy) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Create place
        const placeRef = doc(db, 'places', placeId);
        await setDoc(placeRef, {
            id: placeId,
            name,
            qrCode,
            originLocation: { lat, lng },
            createdAt: serverTimestamp(),
            createdBy,
            isActive: true
        });

        return NextResponse.json({
            success: true,
            message: 'Place created successfully',
            placeId
        });
    } catch (error) {
        console.error('Error creating place:', error);
        return NextResponse.json(
            { error: 'Failed to create place' },
            { status: 500 }
        );
    }
}
