import { NextRequest, NextResponse } from "next/server";
import { updateUserActivityScore } from "@/lib/resume-firestore";

// Force Node.js runtime for Firebase Admin SDK
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const { userId, type, score } = await req.json();

        console.log('[/api/user/update-score] Received:', { userId, type, score });

        if (!userId || !type || score === undefined) {
            return NextResponse.json(
                { error: "userId, type, and score are required" },
                { status: 400 }
            );
        }

        if (type !== 'quiz' && type !== 'interview') {
            return NextResponse.json(
                { error: "Invalid activity type" },
                { status: 400 }
            );
        }

        await updateUserActivityScore(userId, type, score);

        return NextResponse.json({ success: true, message: 'Score updated successfully' });
    } catch (error: any) {
        console.error("❌ [/api/user/update-score] Error:", error);
        console.error("Error stack:", error.stack);
        return NextResponse.json(
            {
                error: "Failed to update score",
                details: error.message,
                type: error.name
            },
            { status: 500 }
        );
    }
}
