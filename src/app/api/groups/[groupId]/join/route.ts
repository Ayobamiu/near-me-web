import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

export async function POST(
    request: NextRequest,
    { params }: { params: { groupId: string } }
) {
    try {
        const { userId } = await request.json();
        const { groupId } = params;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Get group
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await getDoc(groupRef);

        if (!groupDoc.exists()) {
            return NextResponse.json(
                { error: "Group not found" },
                { status: 404 }
            );
        }

        const groupData = groupDoc.data();

        // Check if user is already a member
        if (groupData.memberIds.includes(userId)) {
            return NextResponse.json({
                success: true,
                message: "User is already a member",
            });
        }

        // Add user to group
        await updateDoc(groupRef, {
            memberIds: arrayUnion(userId),
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: "Successfully joined group",
        });
    } catch (error) {
        console.error("Error joining group:", error);
        return NextResponse.json(
            { error: "Failed to join group" },
            { status: 500 }
        );
    }
}
