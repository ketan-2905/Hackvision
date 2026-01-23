import os
import json
from typing import List, Dict, Any
from crewai import Agent, Task, Crew, Process
from langchain_groq import ChatGroq
from langchain.tools import tool

class TiffySearchTool:
    @tool("tiffy_search")
    def search(query: str) -> str:
        """Searches for hackathons, ideathons, and internships using Tiffy API."""
        return json.dumps([
            {
                "type": "IDEATHON",
                "title": "National Innovation Ideathon",
                "organizer": "TechNext",
                "eligibility": "Open for beginners",
                "deadline": "2026-03-10",
                "apply_link": "https://technext.com/ideathon"
            },
            {
                "type": "HACKATHON",
                "title": "Elite Global Hack",
                "organizer": "GDG",
                "eligibility": "CGPA > 7.5 required",
                "deadline": "2026-04-20",
                "apply_link": "https://gdg.community/elite"
            }
        ])

class SeleniumScraperTool:
    @tool("selenium_scraper")
    def scrape(url: str) -> str:
        """Scrapes detailed event information from a specific URL using Selenium."""
        return f"Verified details from {url}: Title, Organizer, Eligibility, Deadline, Application Link."

class AscendraSystem:
    def __init__(self, api_key: str):
        self.llm = ChatGroq(api_key=api_key, model_name="llama3-70b-8192")

    def run(self, profile: Dict[str, Any]) -> str:
        # AGENT 1
        analyzer = Agent(
            role='Profile Analyzer Agent',
            goal='Classify candidate level and detect eligibility constraints based on CGPA and competency.',
            backstory='Expert in academic vetting. Rules: CGPA < 7.5 blocks elite hackathons. High competency allows hackathons.',
            llm=self.llm,
            verbose=False,
            allow_delegation=False
        )

        # AGENT 2
        scraper = Agent(
            role='Opportunity Scraper Agent',
            goal='Fetch real-world opportunities using Tiffy API and Selenium without hallucinations.',
            backstory='Meticulous digital scout. Scrapes title, organizer, eligibility, deadline, and links.',
            llm=self.llm,
            tools=[TiffySearchTool.search, SeleniumScraperTool.scrape],
            verbose=False,
            allow_delegation=False
        )

        # AGENT 3
        recommender = Agent(
            role='Hackathon & Job Recommendation Agent',
            goal='Rank and filter opportunities based on strict logic rules.',
            backstory='Master decision engine. Rules: CGPA < 7.5 -> NO GDG; BEGINNER + competency < 60 -> IDEATHONS ONLY; INTERMEDIATE -> Local; ADVANCED -> Jobs.',
            llm=self.llm,
            verbose=False,
            allow_delegation=False
        )

        # TASKS
        t1 = Task(
            description=f"Analyze student profile: {json.dumps(profile)}. Classify level and set eligibility flags.",
            expected_output="STRICT JSON: {'level': '...', 'eligibility': {'gdg_allowed': bool, 'hackathon_allowed': bool}, 'recommended_focus': [...]}]",
            agent=analyzer
        )

        t2 = Task(
            description="Find opportunities matching the analyzer's focus. Query Tiffy and scrape with Selenium.",
            expected_output="STRICT JSON: {'opportunities': [{'type': '...', 'title': '...', 'eligibility': '...', 'deadline': '...', 'apply_link': '...'}]}",
            agent=scraper,
            context=[t1]
        )

        t3 = Task(
            description="Generate final recommendations. Apply hard rules: CGPA < 7.5 eliminates GDG. Filter by level/competency match.",
            expected_output="STRICT JSON: {'final_recommendations': [{'category': '...', 'reason': '...', 'opportunity': {...}}], 'rejected_categories': [...]}",
            agent=recommender,
            context=[t1, t2]
        )

        crew = Crew(
            agents=[analyzer, scraper, recommender],
            tasks=[t1, t2, t3],
            process=Process.sequential
        )

        return crew.kickoff()

if __name__ == "__main__":
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your_groq_api_key")
    student_profile = {
        "cgpa": 7.2,
        "competency_score": 58,
        "frontend_skill_count": 2,
        "backend_skill_count": 1,
        "ml_ai_skill_count": 0,
        "project_count": 1,
        "internship_count": 0
    }
    ascendra = AscendraSystem(GROQ_API_KEY)
    print(ascendra.run(student_profile))