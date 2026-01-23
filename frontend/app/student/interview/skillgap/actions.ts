"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";


// User's key "XAI_API_KEY" seems to be a Groq key (starts with gsk_)
const groq = createOpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.XAI_API_KEY || process.env.GROQ_API_KEY,
});

// 1. Data Architecture
const STUDENT_RESUME = {
    skills: {
        "Next.js": 80,
        "Python": 70,
        "Basic Prompt Engineering": 60,
        "TypeScript": 75,
        "React": 85,
    },
};

const BENCHMARKS = {
    Google: {
        "MCP Servers": 95,
        "AI Security": 90,
        "Python": 85,
        "System Design": 80,
        "Kubernetes": 75,
    },
    Meta: {
        "Agentic AI": 95,
        "React Internals": 90,
        "Hack Language": 80,
        "Performance Optimization": 85,
        "GraphQL": 80,
    },
    Amazon: {
        "AWS Lambda": 90,
        "DynamoDB": 85,
        "Java": 80,
        "Microservices": 85,
        "Distributed Systems": 90,
    },
};



export async function getGapAnalysis(companyOrBenchmarks: string | { skill: string; benchmark: number }[]) {
    try {
        let benchmarks: Record<string, number> = {};
        let targetName = "";

        if (typeof companyOrBenchmarks === 'string') {
            // It's a company name (Mock)
            benchmarks = BENCHMARKS[companyOrBenchmarks as keyof typeof BENCHMARKS];
            targetName = companyOrBenchmarks;
        } else {
            // It's custom benchmarks from JD
            // Convert array [{skill: "React", benchmark: 90}] to object {"React": 90}
            benchmarks = companyOrBenchmarks.reduce((acc, curr) => {
                acc[curr.skill] = curr.benchmark;
                return acc;
            }, {} as Record<string, number>);
            targetName = "Custom Job";
        }

        // Using Groq model
        const model = groq("llama-3.3-70b-versatile");

        const prompt = `
    Analyze the skill gap between the Student and ${targetName}'s requirements.
    
    Student Skills: ${JSON.stringify(STUDENT_RESUME)}
    Target Benchmark: ${JSON.stringify(benchmarks)}
    
    Task:
    1. Perform a Semantic Match. Even if skill names don't match exactly (e.g., "Basic Prompt Engineering" vs "Agentic AI"), estimate the student's score for the BENCHMARK skill based on their resume context.
    2. Generate structured data for a Radar Chart. The Chart must show the specific skills listed in the Target Benchmark.
       - 'skill': The name of the benchmark skill.
       - 'benchmark': The required score (from the benchmark object).
       - 'student': The estimated student score (0-100) for that specific benchmark skill.
    3. create a 3-step Upskilling Plan to bridge the biggest gaps.

    IMPORTANT: Return ONLY valid JSON matching this structure. Do not output any markdown formatting (like \`\`\`json).
    {
      "radarData": [
        { "skill": "string", "student": number, "benchmark": number }
      ],
      "upskillingPlan": [
        { "step": "string", "title": "string", "description": "string" }
      ]
    }
  `;

        const { text } = await generateText({
            model,
            prompt,
        });

        // Clean text in case model adds markdown blocks
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const object = JSON.parse(cleanText);

        return object;
    } catch (error) {
        console.error("Error in getGapAnalysis:", error);
        throw error;
    }

}

export async function getCourseRecommendations(moduleName: string) {
    try {
        const model = groq("llama-3.3-70b-versatile");

        const prompt = `Search the web for the top 3 high-quality online courses for ${moduleName}. 
        Return ONLY a valid JSON array of objects with these exact keys:
        - title: string (Course Name)
        - platform: string (e.g. Coursera, Udemy, YouTube)
        - url: string (Direct link)

        Example response:
        [
            {"title": "Advanced React Patterns", "platform": "Frontend Masters", "url": "https://frontendmasters.com/..."}
        ]
        
        Do not include any markdown formatting (like \`\`\`json) or conversational text. Return ONLY the JSON string.`;

        // Note: Groq Llama 3.3 does not natively support "live search" parameters via the OpenAI compatibility layer 
        // in the exact way Perplexity does (search_parameters), but we pass them in case the user 
        // swaps the baseURL/Key to a provider that supports it (like Perplexity or a proxy).
        const { text } = await generateText({
            model,
            prompt,
            // @ts-ignore - passing custom parameters for providers that support them
            providerOptions: {
                openai: {
                    search_parameters: {
                        mode: "auto",
                        return_citations: true
                    }
                }
            }
        });

        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        throw new Error("Failed to fetch course recommendations.");
    }
}

