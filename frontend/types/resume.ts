// Resume Analysis Types

export interface SkillDistribution {
    label: string;
    value: number;
}

export interface SectionScore {
    label: string;
    value: number;
}

export interface ExtractedSkills {
    frontend: number;
    backend: number;
    database: number;
    ml: number;
    devops: number;
    corecs: number;
}

export interface ResumeAnalysis {
    atsScore: number;
    baselineCompetencyScore: number;
    strengths: string[];
    gaps: string[];
    suggestions: string[];
    extracted: {
        skills: ExtractedSkills;
    };
    graphs: {
        skillDistribution: SkillDistribution[];
        sectionScores: SectionScore[];
    };
    analysisSource: string;
}

export interface AnalyzeResumeRequest {
    fileName?: string;
    text?: string;
}

export interface AnalyzeResumeResponse {
    success: boolean;
    data?: ResumeAnalysis;
    error?: string;
}

export type DashboardStatus = 'EMPTY' | 'RESUME_UPLOADED' | 'ANALYZED';
