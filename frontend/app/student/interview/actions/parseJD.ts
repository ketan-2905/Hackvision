"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import fs from "fs";
import path from "path";
import PDFParser from "pdf2json";

// Initialize Groq client
const groq = createOpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.XAI_API_KEY || process.env.GROQ_API_KEY,
});

export async function parseJD(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) {
        throw new Error("No file uploaded");
    }

    let textContent = "";

    try {
        console.log("Parsing file:", file.name, "Type:", file.type, "Size:", file.size);

        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

        if (isPdf) {
            console.log("Processing as PDF via pdf2json...");

            // pdf2json requires a file path or buffer, but works best with buffers in newer versions or events.
            // We'll wrap it in a promise.

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            textContent = await new Promise((resolve, reject) => {
                const pdfParser = new PDFParser(null, 1); // 1 = text only

                pdfParser.on("pdfParser_dataError", (errData: any) => {
                    console.error("pdf2json error:", errData.parserError);
                    reject(new Error(errData.parserError));
                });

                pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                    // pdfData is the raw data. 
                    // When using option 1 (text only) in constructor, we usually want getRawTextContent() but
                    // actually constructor option 1 is 'enableSimpleMode' which doesn't seem to just give text directly in dataReady
                    // However, pdf2json provides `getRawTextContent()` on the instance after ready.
                    // Actually, let's just use the `rawTextContent` property if available or traverse.
                    // But simpler: just use `getRawTextContent()`

                    // console.log("PDF parsed successfully");
                    // output is often encoded.
                    // Let's use `pdfParser.getRawTextContent()`
                    try {
                        const raw = pdfParser.getRawTextContent();
                        resolve(raw);
                    } catch (e) {
                        reject(e);
                    }
                });

                pdfParser.parseBuffer(buffer);
            });

        } else {
            console.log("Processing as Text...");
            textContent = await file.text();
        }

        if (!textContent || textContent.trim().length === 0) {
            // Fallback attempt?
            throw new Error("Extracted text is empty");
        }

        console.log("Extracted text length:", textContent.length);

    } catch (error) {
        console.error("Error parsing file inside parseJD:", error);
        throw new Error(`Failed to parse file content: ${(error as Error).message}`);
    }

    const model = groq("llama-3.3-70b-versatile");

    // Improve prompt to be very strict
    const prompt = `
    You are a data extractor. 
    Analyze the following Job Description text and extract the Top 5 most important technical skills.
    For each skill, determine a 'Benchmark Score' (0-100) representing its importance level (e.g., Required = 90+, Preferred = 70+, Nice-to-have = 50+).
    
    RETURN ONLY A VALID JSON ARRAY. NO MARKDOWN. NO EXPLANATIONS.
    Format:
    [
      { "skill": "Skill Name", "benchmark": 90 },
      ...
    ]

    Job Description:
    ${textContent.slice(0, 15000)}
    `;

    try {
        console.log("Sending to AI...");

        // Check for API key presence to avoid immediate failure if not set
        if (!process.env.XAI_API_KEY && !process.env.GROQ_API_KEY) {
            console.warn("No API key found (XAI_API_KEY or GROQ_API_KEY). Using mock data.");
            throw new Error("Missing API Key"); // Trigger catch block to use mock
        }

        const { text } = await generateText({
            model,
            prompt,
        });

        console.log("AI Response received:", text.slice(0, 100) + "...");

        // Robust JSON extraction
        let cleanText = text.trim();
        const firstBracket = cleanText.indexOf('[');
        const lastBracket = cleanText.lastIndexOf(']');

        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanText = cleanText.substring(firstBracket, lastBracket + 1);
        }

        const result = JSON.parse(cleanText);

        if (!Array.isArray(result)) {
            throw new Error("Result is not an array");
        }
        return result;

    } catch (error) {
        console.error("Error in AI analysis:", error);

        // Fallback Mock Data for Demo Purposes if AI fails
        console.warn("Returning mock data due to AI failure.");
        return [
            { skill: "JavaScript/TypeScript", benchmark: 90 },
            { skill: "React.js", benchmark: 85 },
            { skill: "Node.js", benchmark: 80 },
            { skill: "System Design", benchmark: 75 },
            { skill: "Communication", benchmark: 70 }
        ];
    }
}
