import { adminDB } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

type PersonalInfo = {
    full_name?: string;
    email?: string;
    phone?: string;
    location?: string;
};

type SkillsData = {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    ml?: string[];
    devops?: string[];
    corecs?: string[];
};

type Project = {
    title: string;
    summary?: string;
    tech_stack?: string[];
};

type Experience = {
    role: string;
    company: string;
    duration?: string;
    responsibilities?: string[];
};

type Education = {
    institution: string;
    degree: string;
    field_of_study?: string;
    year?: string;
};

export type StructuredResumeData = {
    personal_info: PersonalInfo;
    professional_summary?: string;
    skills: SkillsData;
    projects: Project[];
    experience: Experience[];
    education: Education[];
};

/**
 * Saves resume data to Firestore following the same structure as Python backend
 */
export async function saveResumeToFirestore(
    userId: string,
    data: StructuredResumeData,
    competencyScore?: number,
    resumeUrl?: string
): Promise<void> {
    if (!adminDB) {
        console.error('Firebase Admin not initialized');
        return;
    }

    const userRef = adminDB.collection('users').doc(userId);

    try {
        // 1. Update main user document
        const personalInfo = data.personal_info || {};

        // Build document data, excluding undefined values
        const docData: Record<string, any> = {
            updated_at: FieldValue.serverTimestamp(),
        };

        // Only add fields if they exist  
        if (personalInfo.full_name) docData.full_name = personalInfo.full_name;
        if (personalInfo.email) docData.email = personalInfo.email;
        if (personalInfo.phone) docData.phone = personalInfo.phone;
        if (personalInfo.location) docData.location = personalInfo.location;
        if (data.professional_summary) docData.professional_summary = data.professional_summary;
        if (resumeUrl) docData.resume_url = resumeUrl;

        // Flatten skills for easy access in frontend
        if (data.skills) {
            const allSkills = Object.values(data.skills).flat().filter(Boolean) as string[];
            if (allSkills.length > 0) {
                docData.skills = Array.from(new Set(allSkills)); // Unique skills
            }
        }

        // Initial competency score from resume
        if (competencyScore !== undefined) {
            docData.competency_score = competencyScore;
            docData.scores = {
                resume: competencyScore,
                quiz_avg: 0,
                interview_avg: 0
            };
        }

        await userRef.set(docData, { merge: true });

        // 2. Save skills to subcollection
        const skillsRef = userRef.collection('skills');
        const skills = data.skills || {};

        for (const [category, skillList] of Object.entries(skills)) {
            if (!skillList || !Array.isArray(skillList) || skillList.length === 0) continue;

            for (const skillName of skillList) {
                const skillId = skillName
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]/g, '_')
                    .replace(/_+/g, '_');

                const skillData = {
                    name: skillName,
                    category,
                    confidence: 1.0,
                    source: 'resume',
                    active: true,
                    last_updated: FieldValue.serverTimestamp(),
                };

                // Check if user has manually edited this skill
                const docRef = skillsRef.doc(skillId);
                const doc = await docRef.get();

                if (doc.exists) {
                    const existing = doc.data();
                    // Don't overwrite user-edited skills
                    if (existing?.source === 'user') {
                        continue;
                    }
                }

                await docRef.set(skillData, { merge: true });
            }
        }

        // 3. Save projects to subcollection
        const projectsRef = userRef.collection('projects');
        const projects = data.projects || [];

        for (const project of projects) {
            const title = project.title || 'Untitled';
            const projectId = title
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]/g, '_')
                .substring(0, 50);

            const projectData = {
                title,
                summary: project.summary,
                tech_stack: project.tech_stack || [],
                source: 'resume',
                last_updated: FieldValue.serverTimestamp(),
            };

            const docRef = projectsRef.doc(projectId);
            const doc = await docRef.get();

            if (doc.exists && doc.data()?.source === 'user') {
                continue;
            }

            await docRef.set(projectData, { merge: true });
        }

        // 4. Save experience to subcollection
        const experienceRef = userRef.collection('experience');
        const experiences = data.experience || [];

        for (const exp of experiences) {
            const company = exp.company || 'Unknown';
            const role = exp.role || 'Unknown';
            const expId = `${company}_${role}`
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]/g, '_')
                .substring(0, 50);

            const expData = {
                role,
                company,
                duration: exp.duration,
                responsibilities: exp.responsibilities || [],
                source: 'resume',
            };

            const docRef = experienceRef.doc(expId);
            const doc = await docRef.get();

            if (doc.exists && doc.data()?.source === 'user') {
                continue;
            }

            await docRef.set(expData, { merge: true });
        }

        // 5. Save education to subcollection
        const educationRef = userRef.collection('education');
        const educations = data.education || [];

        for (const edu of educations) {
            const institution = edu.institution || 'Unknown';
            const degree = edu.degree || 'Unknown';
            const eduId = `${institution}_${degree}`
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]/g, '_')
                .substring(0, 50);

            const eduData = {
                institution,
                degree,
                field_of_study: edu.field_of_study,
                year: edu.year,
                source: 'resume',
            };

            const docRef = educationRef.doc(eduId);
            const doc = await docRef.get();

            if (doc.exists && doc.data()?.source === 'user') {
                continue;
            }

            await docRef.set(eduData, { merge: true });
        }

        console.log(`✅ Saved resume data for user ${userId}`);
    } catch (error) {
        console.error('Error saving resume to Firestore:', error);
        throw error;
    }
}

/**
 * Updates user competency score based on activity performance
 */
export async function updateUserActivityScore(
    userId: string,
    type: 'quiz' | 'interview',
    newScore: number
): Promise<void> {
    console.log(`[updateUserActivityScore] Called with userId: ${userId}, type: ${type}, score: ${newScore}`);

    if (!adminDB) {
        const error = 'Firebase Admin DB is not initialized. Check your environment variables.';
        console.error(`❌ ${error}`);
        throw new Error(error);
    }

    const userRef = adminDB.collection('users').doc(userId);

    try {
        await adminDB.runTransaction(async (transaction) => {
            const doc = await transaction.get(userRef);

            if (!doc.exists) {
                throw new Error(`User document not found for userId: ${userId}`);
            }

            const userData = doc.data() || {};
            const scores = userData.scores || { resume: 50, quiz_avg: 0, interview_avg: 0 };
            const history = userData.history || [];

            // Add new activity to history
            // Note: Cannot use FieldValue.serverTimestamp() inside arrays in Firestore
            const activityEntry = {
                type,
                score: newScore,
                timestamp: new Date().toISOString()
            };

            const updatedHistory = [...history, activityEntry];

            // Calculate new averages
            let updatedScores = { ...scores };
            if (type === 'quiz') {
                const quizHistory = updatedHistory.filter((h: any) => h.type === 'quiz');
                const totalQuizScore = quizHistory.reduce((acc: number, h: any) => acc + h.score, 0);
                updatedScores.quiz_avg = Math.round(totalQuizScore / quizHistory.length);
            } else if (type === 'interview') {
                const interviewHistory = updatedHistory.filter((h: any) => h.type === 'interview');
                const totalIntScore = interviewHistory.reduce((acc: number, h: any) => acc + h.score, 0);
                updatedScores.interview_avg = Math.round(totalIntScore / interviewHistory.length);
            }

            // --- DYNAMIC SCORING WEIGHTS ---
            // If an activity hasn't been done, its weight is distributed to others.
            const hasQuiz = updatedHistory.some((h: any) => h.type === 'quiz');
            const hasInterview = updatedHistory.some((h: any) => h.type === 'interview');

            let finalScore = 0;
            if (hasQuiz && hasInterview) {
                // All three: Resume 40%, Quiz 30%, Interview 30%
                finalScore = Math.round(
                    (updatedScores.resume * 0.4) +
                    (updatedScores.quiz_avg * 0.3) +
                    (updatedScores.interview_avg * 0.3)
                );
            } else if (hasQuiz) {
                // Resume + Quiz: Resume 60%, Quiz 40%
                finalScore = Math.round(
                    (updatedScores.resume * 0.6) +
                    (updatedScores.quiz_avg * 0.4)
                );
            } else if (hasInterview) {
                // Resume + Interview: Resume 60%, Interview 40%
                finalScore = Math.round(
                    (updatedScores.resume * 0.6) +
                    (updatedScores.interview_avg * 0.4)
                );
            } else {
                // Resume only: 100%
                finalScore = updatedScores.resume;
            }

            console.log(`[ScoreUpdate] User: ${userId}, Type: ${type}, NewVal: ${newScore}, FinalWeight: ${finalScore}`);

            transaction.update(userRef, {
                competency_score: finalScore,
                scores: updatedScores,
                history: updatedHistory,
                updated_at: FieldValue.serverTimestamp()
            });
        });

        console.log(`✅ Updated ${type} score for user ${userId}. New total: ${newScore}`);
    } catch (error) {
        console.error('❌ Error updating activity score:', error);
        throw error;
    }
}

