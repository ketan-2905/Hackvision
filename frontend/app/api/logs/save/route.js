import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
    try {
        const { timestamp, transcript, anxietyData } = await req.json();

        // Create logs directory if not exists
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        const logFile = path.join(logsDir, 'interview_log.txt');

        const logEntry = `
------------------------------------------------------------------
Timestamp: ${timestamp}
Transcript: "${transcript}"
Average Anxiety: ${(anxietyData.average * 100).toFixed(1)}%
Anxiety Range: ${(anxietyData.min * 100).toFixed(1)}% - ${(anxietyData.max * 100).toFixed(1)}%
Data Points: ${anxietyData.count} samples
------------------------------------------------------------------
`;

        fs.appendFileSync(logFile, logEntry);

        return NextResponse.json({ success: true, message: 'Log saved' });
    } catch (error) {
        console.error('Error saving log:', error);
        return NextResponse.json({ error: 'Failed to save log' }, { status: 500 });
    }
}
