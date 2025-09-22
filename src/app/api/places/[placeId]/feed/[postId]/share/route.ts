import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

// POST /api/places/[placeId]/feed/[postId]/share - Share a post
export async function POST(request: NextRequest) {
  try {
    const urlParts = request.url.split('/');
    const placeId = urlParts[5];
    const postId = urlParts[7];
    const body = await request.json();
    const { userId } = body;

    if (!placeId || !postId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const postRef = doc(db, 'places', placeId, 'feed', postId);

    await updateDoc(postRef, {
      shares: increment(1),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error sharing post:', error);
    return NextResponse.json({ error: 'Failed to share post' }, { status: 500 });
  }
}
