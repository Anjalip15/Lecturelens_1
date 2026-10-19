import os
import re
import time
from groq import Groq, RateLimitError, APITimeoutError, APIConnectionError
from utils.config import GROQ_API_KEY, MODEL_NAME
from utils import prompts
from api.services.embedding_service import embed_text, embed_texts
from api.supabase_client import supabase
from summarization.summarizer import chunk_for_rag

client = Groq(api_key=GROQ_API_KEY, timeout=60.0)

# Change this if your table has a different name (check supabase/schema.sql)
CHUNKS_TABLE = "transcript_embeddings"

# Tunable per experiment (set in the backend .env or terminal, then restart)
SIMILARITY_THRESHOLD = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.25"))
TOP_K = int(os.getenv("RAG_TOP_K", "5"))
ALLOW_GENERAL_FALLBACK = os.getenv("RAG_ALLOW_GENERAL_FALLBACK", "true").lower() == "true"
MAX_TOKENS = int(os.getenv("RAG_MAX_TOKENS", "1500"))

NOT_COVERED_MSG = "This isn't covered in the lecture."


def _clean(text):
    # Some models put hidden reasoning in <think> tags; remove it from the answer
    return re.sub(r"<think>.*?</think>", "", text or "", flags=re.DOTALL).strip()


def call_llm(prompt, temperature=0.3, max_tokens=MAX_TOKENS, max_retries=5):
    last_err = None
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
                extra_body={"reasoning_effort": "low"},  # remove this line if Groq rejects it
            )
            choice = response.choices[0]
            text = _clean(choice.message.content)
            if choice.finish_reason == "length":
                print(f"[rag_service] WARNING: output hit max_tokens ({max_tokens}); answer may be cut off")
            if not text:
                print(f"[rag_service] WARNING: empty completion (finish_reason={choice.finish_reason})")
                last_err = RuntimeError("Model returned an empty answer")
                max_tokens = min(max_tokens * 2, 4000)  # retry with a bigger budget
                continue
            return text
        except (RateLimitError, APITimeoutError, APIConnectionError) as e:
            last_err = e
            if isinstance(e, RateLimitError) and "per day" in str(e):
                print("[rag_service] Daily Groq token limit reached; not retrying.")
                raise
            if attempt == max_retries - 1:
                raise
            wait_time = 2 ** attempt
            print(f"[rag_service] {type(e).__name__}, retrying in {wait_time}s...")
            time.sleep(wait_time)
    raise last_err or RuntimeError("LLM call failed")


def generate_and_store_embeddings(lecture_id: str, segments: list):
    """
    Splits the transcript into small overlapping chunks, embeds them in one
    batch, and stores them in Supabase. Any old chunks for this lecture are
    deleted first, so it is safe to run again (re-embedding).
    """
    chunks = chunk_for_rag(segments)
    if not chunks:
        print(f"[rag_service] No chunks to embed for lecture {lecture_id}")
        return 0

    vectors = embed_texts([c["text"] for c in chunks])

    supabase.table(CHUNKS_TABLE).delete().eq("lecture_id", lecture_id).execute()

    rows = [
        {
            "lecture_id": lecture_id,
            "chunk_text": c["text"],
            "chunk_start": c["start"],
            "chunk_end": c["end"],
            "embedding": vec,
        }
        for c, vec in zip(chunks, vectors)
    ]

    for i in range(0, len(rows), 100):
        supabase.table(CHUNKS_TABLE).insert(rows[i:i + 100]).execute()

    print(f"[rag_service] Stored {len(rows)} chunks for lecture {lecture_id}")
    return len(rows)


def _fallback(question):
    if ALLOW_GENERAL_FALLBACK:
        return {
            "answer": call_llm(prompts.general_knowledge_answer_prompt(question)),
            "source": "general_knowledge",
            "timestamps": [],
        }
    return {"answer": NOT_COVERED_MSG, "source": "not_covered", "timestamps": []}


def answer_question(lecture_id: str, question: str):
    """
    Answers a question about a lecture using RAG. Returns a dict with
    the answer, its source ("lecture", "general_knowledge" or "not_covered"),
    and supporting timestamps if grounded.
    """
    question_embedding = embed_text(question)

    result = supabase.rpc("match_transcript_chunks", {
        "query_embedding": question_embedding,
        "match_lecture_id": lecture_id,
        "match_count": TOP_K,
    }).execute()

    matches = result.data or []
    best_similarity = matches[0]["similarity"] if matches else 0.0

    print(f"[RAG DEBUG] Q: '{question}' | best={best_similarity:.4f} | threshold={SIMILARITY_THRESHOLD} | k={TOP_K}")
    if matches:
        print(f"[RAG DEBUG] top chunk_start={matches[0]['chunk_start']} preview: {matches[0]['chunk_text'][:150]}...")

    if best_similarity < SIMILARITY_THRESHOLD:
        return _fallback(question)

    context_chunks = [m["chunk_text"] for m in matches]
    answer = call_llm(prompts.grounded_answer_prompt(question, context_chunks))

    if answer.strip().strip(".").upper().startswith("NOT_COVERED"):
        return _fallback(question)

    timestamps = [{"start": m["chunk_start"], "end": m["chunk_end"]} for m in matches]
    return {"answer": answer, "source": "lecture", "timestamps": timestamps}