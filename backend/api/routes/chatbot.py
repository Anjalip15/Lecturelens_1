import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from groq import RateLimitError, APITimeoutError, APIConnectionError
from api.deps import get_current_user
from api.supabase_client import supabase
from api.services.rag_service import answer_question

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_QUESTION_CHARS = 1000


class QuestionRequest(BaseModel):
    question: str


@router.post("/lectures/{lecture_id}/ask")
def ask_question(lecture_id: str, request: QuestionRequest, user_id: str = Depends(get_current_user)):
    lecture_result = (
        supabase.table("lectures")
        .select("id, status")
        .eq("id", lecture_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not lecture_result.data:
        raise HTTPException(status_code=404, detail="Lecture not found")

    if lecture_result.data[0]["status"] != "done":
        raise HTTPException(status_code=400, detail="Lecture processing is not complete yet")

    question = (request.question or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    if len(question) > MAX_QUESTION_CHARS:
        raise HTTPException(status_code=400, detail=f"Question is too long (max {MAX_QUESTION_CHARS} characters)")

    try:
        result = answer_question(lecture_id, question)
    except RateLimitError:
        logger.exception("RAG: LLM rate limit")
        raise HTTPException(status_code=429, detail="The AI service is busy. Please try again in a moment.")
    except (APITimeoutError, APIConnectionError):
        logger.exception("RAG: LLM timeout/connection error")
        raise HTTPException(status_code=504, detail="The AI service timed out. Please try again.")
    except Exception as e:
        logger.exception("RAG: unexpected failure")  # full traceback in the backend terminal
        raise HTTPException(status_code=500, detail=f"Failed to answer question: {str(e)}")

    return {
        "lecture_id": lecture_id,
        "question": question,
        "answer": result["answer"],
        "source": result["source"],
        "timestamps": result["timestamps"],
    }