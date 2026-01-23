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

    const prompt = `
    Analyze this Job Description and extract the Top 5 most important technical skills. 
    For each skill, assign a 'Benchmark Score' (0-100) based on how critical it is (e.g., 'Required' = 90+, 'Preferred' = 70, 'Optional/Plus' = 50). 
    Return ONLY a JSON array: [{ "skill": string, "benchmark": number }].

    Job Description:
    ${textContent.slice(0, 15000)}
    `;

    try {
        console.log("Sending to AI...");
        const { text } = await generateText({
            model,
            prompt,
        });

        console.log("AI Response received");

        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleanText);

        if (!Array.isArray(result)) {
            throw new Error("Result is not an array");
        }
        return result;
    } catch (error) {
        console.error("Error in AI analysis:", error);
        throw new Error("Failed to analyze job description with AI");
    }
}
