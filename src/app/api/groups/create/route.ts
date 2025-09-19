import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { Group } from "@/types";

export async function POST(request: NextRequest) {
    try {
        const { placeId, name, createdBy } = await request.json();
        if (!placeId || !name || !createdBy) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if place exists
        const placeRef = doc(db, "places", placeId);
        const placeDoc = await getDoc(placeRef);

        if (!placeDoc.exists()) {
            return NextResponse.json(
                { error: "Place not found" },
                { status: 404 }
            );
        }

        // Create group
        const groupData: Omit<Group, "id"> = {
            placeId,
            name,
            description: `Group chat for ${name}`,
            createdBy,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            memberIds: [createdBy],
        };

        const groupRef = await addDoc(collection(db, "groups"), groupData);

        return NextResponse.json({
            success: true,
            groupId: groupRef.id,
            message: "Group created successfully",
        });
    } catch (error) {
        console.error("Error creating group:", error);
        return NextResponse.json(
            { error: "Failed to create group" },
            { status: 500 }
        );
    }
}
