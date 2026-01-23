import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResumeAnalysis, AnalyzeResumeResponse } from "@/types/resume";
import { saveResumeToFirestore, StructuredResumeData } from "@/lib/resume-firestore";

// Force Node.js runtime (required for Buffer and fetch to Python service)
export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const ANALYSIS_PROMPT = `You are an expert resume analyzer for Ascendra. Analyze the provided resume content and return a JSON response with the following structure:

{
  "atsScore": number (0-100),
  "baselineCompetencyScore": number (0-100),
  "strengths": Array<string> (4-6 specific strengths from the resume),
  "gaps": Array<string> (4-6 areas for improvement),
  "suggestions": Array<string> (4-6 actionable suggestions),
  "extracted": {
    "skills": {
      "frontend": number (count of frontend skills),
      "backend": number (count of backend skills),
      "database": number (count of database skills),
      "ml": number (count of ML/AI skills),
      "devops": number (count of DevOps skills),
      "corecs": number (count of core CS skills)
    }
  },
  "graphs": {
    "skillDistribution": [
      {"label": "Frontend", "value": percentage},
      {"label": "Backend", "value": percentage},
      {"label": "Database", "value": percentage},
      {"label": "ML/AI", "value": percentage},
      {"label": "DevOps", "value": percentage},
      {"label": "Core CS", "value": percentage}
    ],
    "sectionScores": [
      {"label": "Impact", "value": number 0-100},
      {"label": "Clarity", "value": number 0-100},
      {"label": "Structure", "value": number 0-100},
      {"label": "Keywords", "value": number 0-100}
    ]
  },
  "analysisSource": "Ascendra Intelligence"
}

Be specific, clinical, and actionable. Focus on technical skills, project experience, and presentation quality. Avoid filler. Return strict JSON only.`;

async function extractTextFromFile(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Call Python text extraction service (PyMuPDF-based, much more reliable)
    const formData = new FormData();
    formData.append("file", new Blob([buffer]), file.name);

    try {
        const response = await fetch("http://127.0.0.1:8001/extract-text", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: "Unknown error" }));
            throw new Error(error.detail || "Python extraction service failed");
        }

        const data = await response.json();
        console.log(`✅ Extracted ${data.length} characters from ${data.filename}`);

        return data.text || "";

    } catch (fetchError: any) {
        // If Python service is not running, provide helpful error
        if (fetchError.code === "ECONNREFUSED" || fetchError.message.includes("fetch failed")) {
            throw new Error(
                "PDF extraction service not running. Please start it with: python text_extractor.py"
            );
        }
        throw fetchError;
    }
}

async function analyzeWithGemini(
    resumeText: string,
    modelName: string = "gemini-2.5-flash"
): Promise<ResumeAnalysis> {
    try {
        console.log("Starting analysis...");

        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        const result = await model.generateContent([
            { text: ANALYSIS_PROMPT },
            { text: `Analyze this resume content:\n\n${resumeText}` },
        ]);

        const responseText = result.response.text();
        if (!responseText) throw new Error("NO_GEMINI_RESPONSE");

        const analysis: ResumeAnalysis = JSON.parse(responseText);
        return analysis;
    } catch (error: any) {
        console.error("!!! GEMINI API ERROR !!!");
        console.error(error);

        // If the chosen model is invalid, fallback once to a safer model name.
        // (You can change fallback target if your account only supports specific models.)
        if (error?.status === 404 && modelName !== "gemini-2.5-flash") {
            console.log("Model 404, falling back to gemini-2.5-flash...");
            return analyzeWithGemini(resumeText, "gemini-2.5-flash");
        }

        console.log("Falling back to mock data...");
        return generateMockAnalysis(resumeText);
    }
}

const EXTRACTION_PROMPT = `Extract structured information from this resume text and return ONLY valid JSON in this exact format:

{
  "personal_info": {
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "location": "string"
  },
  "professional_summary": "2-3 sentence summary",
  "skills": {
    "frontend": ["React", "Vue", ...],
    "backend": ["Node.js", "Python", ...],
    "database": ["MongoDB", "PostgreSQL", ...],
    "ml": ["TensorFlow", "PyTorch", ...],
    "devops": ["Docker", "Kubernetes", ...],
    "corecs": ["Data Structures", "Algorithms", ...]
  },
  "projects": [
    {
      "title": "Project Name",
      "summary": "Brief description",
      "tech_stack": ["React", "Node.js", ...]
    }
  ],
  "experience": [
    {
      "role": "Software Engineer",
      "company": "Company Name",
      "duration": "Jan 2020 - Dec 2022",
      "responsibilities": ["Responsibility 1", "Responsibility 2"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "field_of_study": "Computer Science",
      "year": "2020"
    }
  ]
}

Rules:
- Extract only what is explicitly mentioned in the resume
- Use empty arrays [] if a section is not found
- Categorize skills appropriately (frontend, backend, database, ml, devops, corecs)
- Return ONLY the JSON object, no markdown, no extra text
`;

async function extractStructuredData(resumeText: string): Promise<StructuredResumeData | null> {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // Fixed: gemini-pro returns 404
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        const result = await model.generateContent([
            { text: EXTRACTION_PROMPT },
            { text: `Resume content:\n\n${resumeText}` },
        ]);

        const responseText = result.response.text();
        if (!responseText) return null;

        const data: StructuredResumeData = JSON.parse(responseText);
        return data;
    } catch (error) {
        console.error('Structured extraction failed:', error);
        return null;
    }
}

function generateMockAnalysis(text: string): ResumeAnalysis {
    const hasExperience = text?.toLowerCase().includes("experience") || Math.random() > 0.3;
    const hasProjects = text?.toLowerCase().includes("project") || Math.random() > 0.4;
    const hasSkills = text?.toLowerCase().includes("skill") || Math.random() > 0.5;

    const baseScore = hasExperience ? 70 : 50;
    const projectBonus = hasProjects ? 10 : 0;
    const skillBonus = hasSkills ? 15 : 0;

    return {
        atsScore: Math.min(85, baseScore + Math.floor(Math.random() * 20)),
        baselineCompetencyScore: Math.min(75, baseScore + projectBonus + skillBonus),
        strengths: [
            "Strong technical foundation in modern frameworks",
            "Demonstrated project experience with real-world applications",
            "Clear communication of technical concepts",
            hasExperience ? "Relevant industry experience documented" : "Academic projects showcase learning ability",
        ],
        gaps: [
            !hasExperience ? "Limited professional work experience" : "Could expand on leadership roles",
            "Missing quantified impact metrics in project descriptions",
            "No mention of testing or quality assurance practices",
            "Soft skills could be better highlighted",
        ],
        suggestions: [
            'Add metrics: "Improved performance by X%", "Reduced load time by Y seconds"',
            "Include open-source contributions or a portfolio link",
            "Highlight collaboration and team ownership explicitly",
            hasSkills ? "Organize skills by proficiency level" : "Add a dedicated skills section",
            "Add certifications or relevant coursework completion",
        ],
        extracted: {
            skills: {
                frontend: hasSkills ? Math.floor(Math.random() * 30) + 20 : 10,
                backend: hasSkills ? Math.floor(Math.random() * 25) + 15 : 8,
                database: Math.floor(Math.random() * 15) + 10,
                ml: hasProjects ? Math.floor(Math.random() * 20) + 5 : 3,
                devops: Math.floor(Math.random() * 15) + 8,
                corecs: Math.floor(Math.random() * 20) + 15,
            },
        },
        graphs: {
            skillDistribution: [
                { label: "Frontend", value: hasSkills ? Math.floor(Math.random() * 30) + 40 : 25 },
                { label: "Backend", value: hasSkills ? Math.floor(Math.random() * 25) + 30 : 20 },
                { label: "Database", value: Math.floor(Math.random() * 20) + 15 },
                { label: "ML/AI", value: hasProjects ? Math.floor(Math.random() * 25) + 10 : 8 },
                { label: "DevOps", value: Math.floor(Math.random() * 20) + 15 },
                { label: "Core CS", value: Math.floor(Math.random() * 25) + 20 },
            ],
            sectionScores: [
                { label: "Impact", value: Math.floor(Math.random() * 30) + 65 },
                { label: "Clarity", value: Math.floor(Math.random() * 25) + 70 },
                { label: "Structure", value: Math.floor(Math.random() * 20) + 75 },
                { label: "Keywords", value: hasSkills ? Math.floor(Math.random() * 20) + 70 : 60 },
            ],
        },
        analysisSource: "Mock Local System v1.0",
    };
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const userId = formData.get("userId") as string | null; // Get user ID from request

        if (!file) {
            return NextResponse.json<AnalyzeResumeResponse>(
                { success: false, error: "FILE_REQUIRED" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json<AnalyzeResumeResponse>(
                { success: false, error: "USER_ID_REQUIRED" },
                { status: 400 }
            );
        }

        console.log(`Processing file: ${file.name} (${file.type}) for user: ${userId}`);

        let extractedText = "";
        try {
            extractedText = await extractTextFromFile(file);
        } catch (extractionError: any) {
            console.error("Text extraction failed:", extractionError);
            return NextResponse.json<AnalyzeResumeResponse>(
                { success: false, error: extractionError?.message || "EXTRACTION_FAILED" },
                { status: 500 }
            );
        }

        if (!extractedText || extractedText.trim().length < 50) {
            return NextResponse.json<AnalyzeResumeResponse>(
                { success: false, error: "EMPTY_TEXT_EXTRACTED" },
                { status: 422 }
            );
        }

        // Analyze resume with Gemini (for UI display)
        const analysis = await analyzeWithGemini(extractedText);

        // Extract structured data and save to Firestore
        try {
            console.log('Extracting structured data...');
            const structuredData = await extractStructuredData(extractedText);

            if (structuredData) {
                console.log('Saving to Firestore...');
                const competencyScore = analysis.baselineCompetencyScore;
                await saveResumeToFirestore(userId, structuredData, competencyScore);
                console.log('✅ Resume data saved to Firestore');
            } else {
                console.warn('⚠️ Structure extraction failed, skipping Firestore save');
            }
        } catch (firestoreError) {
            // Don't fail the entire request if Firestore save fails
            console.error('Firestore save error (non-fatal):', firestoreError);
        }

        return NextResponse.json<AnalyzeResumeResponse>({
            success: true,
            data: analysis,
        });
    } catch (error: any) {
        console.error("Resume analysis error:", error);
        return NextResponse.json<AnalyzeResumeResponse>(
            { success: false, error: error?.message || "INTERNAL_SERVER_ERROR" },
            { status: 500 }
        );
    }
}
