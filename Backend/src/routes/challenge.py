from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..ai_generator import generate_challenge_with_ai
from ..database.db import (
    get_challenge_quota,
    create_challenge,
    create_challenge_quota,
    reset_quota_if_needed,
    get_user_challenges
)
from ..utils import authenticate_and_get_user_details
from ..database.models import get_db
import json
from datetime import datetime
from ..database.models import Challenge,ChallengeQuota

router = APIRouter()


class ChallengeRequest(BaseModel):
    interviewRole: str
    experience: str
    difficulty: str
    questionCount: int

    class Config:
        json_schema_extra = {"example": {"difficulty": "easy"}}


@router.post("/generate-challenge")
async def generate_challenge(
    request: ChallengeRequest,
    request_obj: Request,
    db: Session = Depends(get_db)
):
    try:
        print(request.dict())

        user_details = authenticate_and_get_user_details(request_obj)
        user_id = user_details.get("user_id")

        quota = get_challenge_quota(db, user_id)

        if not quota:
            quota = create_challenge_quota(db, user_id)

        quota = reset_quota_if_needed(db, quota)

        # quota check according to question count
        if quota.quota_remaining < request.questionCount:
            raise HTTPException(
                status_code=429,
                detail=f"Only {quota.quota_remaining} questions remaining"
            )

        # AI se multiple questions generate honge
        challenge_data = generate_challenge_with_ai(
            request.difficulty,
            request.interviewRole,
            request.experience,
            request.questionCount
        )

        saved_challenges = []

        # multiple questions save karo
        for question in challenge_data["questions"]:
            new_challenge = create_challenge(
                db=db,
                difficulty=request.difficulty,
                created_by=user_id,
                title=question["title"],
                options=json.dumps(question["options"]),
                correct_answer_id=question["correct_answer_id"],
                explanation=question["explanation"]
            )

            db.flush()
            db.refresh(new_challenge)

            saved_challenges.append({
                "id": new_challenge.id,
                "difficulty": new_challenge.difficulty,
                "title": new_challenge.title,
                "options": json.loads(new_challenge.options),
                "correct_answer_id": new_challenge.correct_answer_id,
                "explanation": new_challenge.explanation,
                "timestamp": new_challenge.date_created.isoformat()
            })

        # quota reduce according to question count
        quota.quota_remaining -= request.questionCount

        # final commit
        db.commit()

        return {
            "questions": saved_challenges,
            "total_questions": len(saved_challenges)
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))



@router.get("/my-history")
async def my_history(request: Request, db: Session = Depends(get_db)):
    user_details = authenticate_and_get_user_details(request)
    user_id = user_details.get("user_id")

    challenges = get_user_challenges(db, user_id)
    return {"challenges": challenges}


@router.delete("/clear-history")
async def clear_history(request: Request, db: Session = Depends(get_db)):
    try:
        user_details = authenticate_and_get_user_details(request)
        user_id = user_details.get("user_id")

        deleted_count = (
           db.query(Challenge)
           .filter(Challenge.created_by == user_id)
           .delete()
        )

        db.commit()

        return {
            "message": "History cleared successfully",
            "deleted_count": deleted_count
        }

    except Exception as e:
        print(e);
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))



@router.get("/quota")
async def get_quota(request: Request, db: Session = Depends(get_db)):

    user_details = authenticate_and_get_user_details(request)

    user_id = user_details.get("user_id")

    quota = get_challenge_quota(db, user_id)
    if not quota:
        return {
            "user_id": user_id,     
            "quota_remaining": 0,
            "last_reset_date": datetime.now()
        }

    quota = reset_quota_if_needed(db, quota)
    return quota

@router.get("/clear-quota")
async def clear_quota(request: Request, db: Session = Depends(get_db)):
    try:
        user_details = authenticate_and_get_user_details(request)

        user_id = user_details.get("user_id")
        res = (
            db.query(ChallengeQuota)
           .filter(ChallengeQuota.created_by == user_id)
           .delete()
        )

        db.commit()

        return {
            "message": "Quota cleared successfully",
        }
    except Exception as e:
        print(e);
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    