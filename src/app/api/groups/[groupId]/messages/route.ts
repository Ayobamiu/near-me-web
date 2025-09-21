import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, setDoc, query, orderBy, limit, getDocs, doc } from "firebase/firestore";
import { GroupMessage } from "@/types";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ groupId: string }> }
) {
    try {
        const { senderId, content, messageType = 'text' } = await request.json();
        const { groupId } = await params;

        if (!senderId || !content) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create message in subcollection: /groups/{groupId}/messages/{messageId}
        const groupRef = doc(db, "groups", groupId);
        const messagesRef = collection(groupRef, "messages");
        const messageRef = doc(messagesRef); // Generate a new document ID

        const messageData: Omit<GroupMessage, "id"> = {
            groupId,
            senderId,
            content,
            messageType,
            createdAt: new Date(),
            readBy: [senderId], // Sender has read their own message
        };

        await setDoc(messageRef, messageData);

        return NextResponse.json({
            success: true,
            messageId: messageRef.id,
            message: "Message sent successfully",
        });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ groupId: string }> }
) {
    try {
        const { groupId } = await params;
        const { searchParams } = new URL(request.url);
        const limitCount = parseInt(searchParams.get("limit") || "50");

        // Get messages from subcollection
        const groupRef = doc(db, "groups", groupId);
        const messagesRef = collection(groupRef, "messages");
        const messagesQuery = query(
            messagesRef,
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );

        const messagesSnapshot = await getDocs(messagesQuery);

        const messages = messagesSnapshot.docs.map(doc => {
            const data = doc.data();

            let createdAt: Date;
            if (data.createdAt && data.createdAt.toDate) {
                createdAt = data.createdAt.toDate();
            } else if (data.createdAt instanceof Date) {
                createdAt = data.createdAt;
            } else {
                createdAt = new Date(); // Fallback to current time
            }

            return {
                id: doc.id,
                ...data,
                createdAt,
            };
        });
        return NextResponse.json({
            success: true,
            messages: messages.reverse(), // Reverse to get chronological order
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch messages",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
