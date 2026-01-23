import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Fallback quiz data if Gemini fails
const getFallbackQuiz = (type: string) => {
    if (type === 'technical') {
        return [
            {
                question: "What is the purpose of React's useEffect hook?",
                options: ["To manage component state", "To handle side effects in functional components", "To create context providers", "To optimize rendering performance"],
                correctAnswer: 1,
                explanation: "useEffect handles side effects in functional components, such as data fetching, subscriptions, and DOM manipulations."
            },
            {
                question: "In TypeScript, what is the difference between 'interface' and 'type'?",
                options: ["No difference, they are identical", "Interfaces can extend, types cannot", "Types can use unions, interfaces cannot", "Types are faster at compile time"],
                correctAnswer: 2,
                explanation: "Type aliases can represent unions, intersections, and other complex types, while interfaces are primarily for object shapes and can be extended."
            },
            {
                question: "What does CSS 'flexbox' primarily help with?",
                options: ["Animations", "Layout design", "Color management", "Font rendering"],
                correctAnswer: 1,
                explanation: "Flexbox is a CSS layout model designed to arrange and align items within a container efficiently."
            },
            {
                question: "What is the time complexity of searching in a balanced binary search tree?",
                options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
                correctAnswer: 1,
                explanation: "A balanced BST provides O(log n) search time because it divides the search space in half at each step."
            },
            {
                question: "Which HTTP method is idempotent?",
                options: ["POST", "GET", "PATCH", "All of the above"],
                correctAnswer: 1,
                explanation: "GET is idempotent - making the same request multiple times produces the same result without changing server state."
            }
        ];
    } else {
        return [
            {
                question: "If all bloops are razzies and all razzies are lazzies, are all bloops definitely lazzies?",
                options: ["Yes", "No", "Sometimes", "Cannot be determined"],
                correctAnswer: 0,
                explanation: "By transitive property, if A = B and B = C, then A = C. Therefore all bloops are lazzies."
            },
            {
                question: "What comes next in the sequence: 2, 6, 12, 20, 30, ?",
                options: ["40", "42", "44", "48"],
                correctAnswer: 1,
                explanation: "The sequence follows the pattern n(n+1): 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42."
            },
            {
                question: "If 5 machines can produce 5 widgets in 5 minutes, how many machines are needed to produce 100 widgets in 100 minutes?",
                options: ["5", "20", "100", "500"],
                correctAnswer: 0,
                explanation: "Each machine produces 1 widget in 5 minutes, so in 100 minutes one machine produces 20 widgets. 5 machines produce 100 widgets in 100 minutes."
            },
            {
                question: "Which figure completes the pattern: Circle, Square, Triangle, Circle, Square, ?",
                options: ["Circle", "Square", "Triangle", "Rectangle"],
                correctAnswer: 2,
                explanation: "The pattern repeats every 3 elements: Circle, Square, Triangle. So the next element is Triangle."
            },
            {
                question: "If you rearrange the letters 'CIFAIPC' you get the name of a:",
                options: ["City", "Animal", "Ocean", "Country"],
                correctAnswer: 2,
                explanation: "The letters rearrange to spell 'PACIFIC', which is an ocean."
            }
        ];
    }
};

export async function POST(req: NextRequest) {
    try {
        const { type, skills } = await req.json();
        console.log('Generating quiz for type:', type, 'with skills:', skills);

        let questions;

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            let prompt = '';

            if (type === 'technical') {
                prompt = `Generate exactly 5 multiple-choice questions for a technical assessment for a candidate with these skills: ${skills.join(', ')}.
Difficulty Level: Intermediate to Advanced.
Focus on real-world scenarios and specific technical concepts within these areas.

For each question, provide:
- question: The question text (clear, concise, and technically accurate)
- options: Array of exactly 4 distinct options (labeled A, B, C, D)
- correctAnswer: Zero-indexed integer of the correct option (0 for A, 1 for B, 2 for C, 3 for D)
- explanation: A detailed 1-2 sentence explanation of why the answer is correct and why other key options are incorrect.

Return ONLY a valid JSON array in this exact format:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctAnswer": 0,
    "explanation": "..."
  }
]

Important: Return ONLY the JSON array. Do not include any decorative text, markdown blocks, or commentary.`;
            } else {
                prompt = `Generate exactly 5 multiple-choice questions for an analytical and logical reasoning assessment.
Topics: Logical deduction, sequence logic, pattern recognition, and complex problem-solving scenarios.
Difficulty: Challenging.

For each question, provide:
- question: The question text (structured logically)
- options: Array of exactly 4 plausible options (labeled A, B, C, D)
- correctAnswer: Zero-indexed integer of the correct option (0 for A, 1 for B, 2 for C, 3 for D)
- explanation: A 1-2 sentence logical breakdown of the solution.

Return ONLY a valid JSON array in this exact format:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctAnswer": 0,
    "explanation": "..."
  }
]

Important: Return ONLY the JSON array. Do not include any decorative text, markdown blocks, or commentary.`;
            }

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                }
            });
            const response = await result.response;
            let text = response.text();

            console.log('Engine response length:', text.length);

            // Robust JSON extraction
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                text = jsonMatch[0];
            }

            // Parse the JSON
            try {
                questions = JSON.parse(text);
                console.log('Successfully parsed', questions.length, 'questions from engine');
            } catch (parseError) {
                console.error('Failed to parse AI response, using fallback');
                console.error('Parse error:', parseError);
                console.error('Text that failed to parse:', text);
                questions = getFallbackQuiz(type);
            }

            // Validate we have questions
            if (!Array.isArray(questions) || questions.length === 0) {
                console.error('Invalid questions array, using fallback');
                questions = getFallbackQuiz(type);
            }

            // Ensure we have exactly 5 questions
            if (questions.length < 5) {
                console.warn('Got fewer than 5 questions, padding with fallback');
                const fallback = getFallbackQuiz(type);
                while (questions.length < 5) {
                    questions.push(fallback[questions.length % fallback.length]);
                }
            } else if (questions.length > 5) {
                console.warn('Got more than 5 questions, trimming to 5');
                questions = questions.slice(0, 5);
            }

        } catch (aiError) {
            console.error('AI API error, using fallback quiz:', aiError);
            questions = getFallbackQuiz(type);
        }

        // Create quiz object
        const quiz = {
            id: `quiz_${Date.now()}`,
            type,
            questions: questions.map((q, idx) => ({
                id: `q${idx + 1}`,
                ...q,
            })),
            createdAt: new Date().toISOString(),
        };

        console.log('Successfully created quiz with', quiz.questions.length, 'questions');
        return NextResponse.json({ quiz });
    } catch (error) {
        console.error('Quiz generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate quiz', details: (error as Error).message },
            { status: 500 }
        );
    }
}
