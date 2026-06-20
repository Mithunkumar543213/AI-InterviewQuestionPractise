
import os
import json

from openai import OpenAI
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_challenge_with_ai(
    difficulty: str,
    interviewRole: str,
    experience: int,
    questionCount: int
) -> Dict[str, Any]:

    system_prompt = f"""
    You are an expert technical interviewer and coding challenge creator.

    Generate {questionCount} interview questions for a candidate.

    Candidate Details:
    - Target Role: {interviewRole}
    - Experience Level: {experience} years
    - Difficulty Level: {difficulty}

    Rules:
    1. Questions must match the role.
    2. Questions must match the experience level.
    3. Questions must match the difficulty.
    4. Questions should simulate real interview patterns.

    Return ONLY valid JSON in this exact structure:

    {{
        "questions": [
            {{
                "title": "Question title",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "correct_answer_id": 0,
                "explanation": "Detailed explanation"
            }}
        ]
    }}

    Important:
    - Generate exactly {questionCount} questions
    - Only 4 options per question
    - Only one correct answer
    - No extra text
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo-0125",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": f"""
                    Generate {questionCount} {difficulty} interview questions for {interviewRole}
                    with {experience} years experience.
                    """
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )

        content = response.choices[0].message.content
        challenge_data = json.loads(content)

        if "questions" not in challenge_data:
            raise ValueError("Missing questions field")

        for question in challenge_data["questions"]:
            required_fields = ["title", "options", "correct_answer_id", "explanation"]

            for field in required_fields:
                if field not in question:
                    raise ValueError(f"Missing required field: {field}")

        return challenge_data

    except Exception as e:
        print(e)
        return {
            "questions": [
                {
                    "title": "Basic Python List Operation",
                    "options": [
                        "my_list.append(5)",
                        "my_list.add(5)",
                        "my_list.push(5)",
                        "my_list.insert(5)"
                    ],
                    "correct_answer_id": 0,
                    "explanation": "In Python, append() adds an element at the end of a list."
                }
            ]
        }