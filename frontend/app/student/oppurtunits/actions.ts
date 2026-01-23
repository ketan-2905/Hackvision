"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { tavily } from "@tavily/core";

// Initialize Groq client
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.XAI_API_KEY || process.env.GROQ_API_KEY,
});

// Initialize Tavily client with provided key
const tavilyClient = tavily({ apiKey: "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" });

export type StudentProfile = {
  skills: {
    programming_languages: string[];
    frameworks: string[];
    tools: string[];
  };
  experience: {
    project_count: number;
    internship_count: number;
  };
  scores: {
    aptitude: number;
    technical: number;
    case_study: number;
  };
  soft_skills: {
    communication: number;
    problem_solving: number;
    adaptability: number;
    knowledge_depth: number;
  };
};

export async function getOpportunities(studentProfile: StudentProfile) {
  try {
    // 1. Generate search query from profile
    // Extract top skills for the search query
    const skillsAndFrameworks = [
      ...studentProfile.skills.programming_languages,
      ...studentProfile.skills.frameworks
    ].slice(0, 3).join(" "); // Take top 3 to keep query focused

    const searchQuery = `upcoming hackathons and internships for ${skillsAndFrameworks || "cs students"} 2025 2026 apply now in maharashtra`;

    // 2. Perform Web Search
    const searchResponse = await tavilyClient.search(searchQuery, {
      searchDepth: "advanced",
      maxResults: 6,
      includeAnswer: true
    });

    // Map results to the format expected by the LLM
    const webSearchResults = searchResponse.results.map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.content, // Using content as snippet for better context
      content: result.content
    }));

    // 3. LLM Processing
    const model = groq("llama-3.3-70b-versatile");

    const prompt = `
You are an AI Opportunity Extraction & Verification Engine.

You are given REAL-TIME WEB SEARCH RESULTS fetched from the internet
using a search API (Tavily). Each result includes the actual content
from the linked page.

You MUST rely ONLY on the provided web data.
Do NOT invent, assume, or hallucinate any opportunity.

-------------------------------------------------
INPUT
-------------------------------------------------

student_profile:
${JSON.stringify(studentProfile, null, 2)}

web_search_results: 
${JSON.stringify(webSearchResults, null, 2)}

-------------------------------------------------
YOUR TASK
-------------------------------------------------

1. Read and understand EACH web search result carefully.
   - Treat page content as the source of truth.
   - Ignore results that do not clearly describe an opportunity.

2. Infer the student’s realistic readiness level:
   - beginner / mid / high
   - based on skills, experience, and scores.

3. From the web results, extract ONLY opportunities that:
   - are clearly hackathons or internships
   - are currently open, upcoming, or recurring
   - match the student’s readiness level
   - explicitly mention role, theme, or eligibility

4. Select AT MOST:
   - 2–3 hackathons
   - 2–3 internships

5. If required information is missing from a page:
   - infer ONLY if strongly implied
   - otherwise mark it as "not specified"

-------------------------------------------------
OUTPUT (STRICT JSON ONLY)
-------------------------------------------------

{
  "profile_summary": {
    "inferred_level": "beginner | mid | high",
    "primary_domain": "frontend | backend | fullstack | ai_ml | devops | core_cs",
    "justification": "string"
  },

  "hackathons": [
    {
      "name": "string",
      "theme_or_focus": "string",
      "level": "beginner | mid | high | not specified",
      "mode": "online | offline | hybrid | not specified",
      "location": "string",
      "eligibility": "string",
      "key_skills_mentioned": ["string"],
      "official_link": "string",
      "source_title": "string",
      "why_this_matches_student": "string"
    }
  ],

  "internships": [
    {
      "organization": "string",
      "role": "string",
      "level": "beginner | mid | high | not specified",
      "location": "string",
      "duration": "string",
      "skills_required": ["string"],
      "official_link": "string",
      "source_title": "string",
      "why_this_matches_student": "string"
    }
  ],

  "confidence_score": 0-100
}

-------------------------------------------------
STRICT RULES
-------------------------------------------------
- Output ONLY valid JSON
- Use ONLY the provided web_search_results
- Do NOT fabricate opportunity names or links
- If nothing matches, return empty arrays
- Prefer accuracy over completeness
`;

    const { text } = await generateText({
      model,
      prompt,
    });

    // Clean and parse JSON
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      return JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse LLM JSON response", text);
      throw new Error("Invalid JSON response from LLM");
    }

  } catch (error) {
    console.error("Error in getOpportunities:", error);
    throw error;
  }
}
