import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

// POST /api/places/[placeId]/feed/[postId]/comment - Add a comment to a post
export async function POST(request: NextRequest) {
  try {
    const urlParts = request.url.split('/');
    const placeId = urlParts[5];
    const postId = urlParts[7];
    const body = await request.json();
    const { authorId, content } = body;

    if (!placeId || !postId || !authorId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const postRef = doc(db, 'places', placeId, 'feed', postId);
    const commentId = Date.now().toString(); // Simple ID generation

    const comment = {
      id: commentId,
      postId,
      authorId,
      content,
      createdAt: new Date(),
      likes: [],
    };

    await updateDoc(postRef, {
      comments: arrayUnion(comment),
    });

    return NextResponse.json({
      success: true,
      commentId,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
