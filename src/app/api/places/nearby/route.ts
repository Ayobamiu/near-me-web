import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Place } from '@/types';

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = parseFloat(searchParams.get('lat') || '0');
        const lng = parseFloat(searchParams.get('lng') || '0');
        const radius = parseFloat(searchParams.get('radius') || '1'); // Default 1km

        if (!lat || !lng) {
            return NextResponse.json(
                { error: 'Latitude and longitude are required' },
                {
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    },
                }
            );
        }

        // Get all active places
        const placesRef = collection(db, 'places');
        const activePlacesQuery = query(
            placesRef,
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );

        const placesSnapshot = await getDocs(activePlacesQuery);
        const nearbyPlaces: (Place & { distance: number; userCount: number })[] = [];

        for (const doc of placesSnapshot.docs) {
            const placeData = doc.data();
            const placeLat = placeData.location?.lat;
            const placeLng = placeData.location?.lng;

            if (!placeLat || !placeLng) continue;

            // Calculate distance
            const distance = calculateDistance(lat, lng, placeLat, placeLng);

            // Only include places within the specified radius
            if (distance <= radius) {
                // Get user count for this place
                const usersRef = collection(db, 'places', doc.id, 'users');
                const usersSnapshot = await getDocs(usersRef);
                const userCount = usersSnapshot.docs.length;

                const place: Place & { distance: number; userCount: number } = {
                    id: doc.id,
                    name: placeData.name || 'Unnamed Place',
                    qrCode: doc.id, // Use document ID as QR code
                    originLocation: {
                        lat: placeLat,
                        lng: placeLng
                    },
                    createdBy: placeData.createdBy || '',
                    isActive: placeData.isActive || false,
                    createdAt: placeData.createdAt?.toDate() || new Date(),
                    distance,
                    userCount
                };

                nearbyPlaces.push(place);
            }
        }

        // Sort by distance (closest first)
        nearbyPlaces.sort((a, b) => a.distance - b.distance);

        return NextResponse.json({
            success: true,
            places: nearbyPlaces,
            count: nearbyPlaces.length
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });

    } catch (error) {
        console.error('Error fetching nearby places:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch nearby places',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
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
