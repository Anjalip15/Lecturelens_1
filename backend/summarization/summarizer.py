"""
LectureLens - Transcript Summarizer / Simplifier Module
---------------------------------------------------------
Takes a Whisper transcript (list of timestamped segments) and produces
summary + glossary (+ optionally quiz) using ONE combined LLM call per
chunk, to stay within Groq's free-tier token-per-minute limits.
"""

import os
import re
import json
import time
from groq import Groq, RateLimitError, APITimeoutError, APIConnectionError
from utils.config import GROQ_API_KEY, MODEL_NAME, CHUNK_MAX_WORDS, GLOSSARY_PATH, MCQS_PER_CHUNK, SHORT_ANSWERS_PER_CHUNK
from utils import prompts

client = Groq(api_key=GROQ_API_KEY, timeout=60.0)
MODEL = MODEL_NAME


def _clean(text):
    # Some models put hidden reasoning in <think> tags; remove it from the output
    return re.sub(r"<think>.*?</think>", "", text or "", flags=re.DOTALL).strip()


def chunk_transcript(segments, max_words=CHUNK_MAX_WORDS):
    """Large chunks for summaries and quizzes."""
    chunks = []
    current_words = 0
    current_text = []
    chunk_start = None

    for seg in segments:
        if chunk_start is None:
            chunk_start = seg["start"]

        current_text.append(seg["text"].strip())
        current_words += len(seg["text"].split())

        if current_words >= max_words:
            chunks.append({
                "start": chunk_start,
                "end": seg["end"],
                "text": " ".join(current_text)
            })
            current_text = []
            current_words = 0
            chunk_start = None

    if current_text:
        chunks.append({
            "start": chunk_start,
            "end": segments[-1]["end"],
            "text": " ".join(current_text)
        })

    return chunks


def chunk_for_rag(segments, max_words=120, overlap_segments=1):
    """
    Small overlapping chunks for retrieval (RAG only).
    Summaries/quizzes keep using chunk_transcript().
    Same output keys as chunk_transcript: start, end, text.
    """
    segments = [s for s in segments if s.get("text", "").strip()]
    chunks, current, words = [], [], 0

    for seg in segments:
        seg_words = len(seg["text"].split())
        if current and words + seg_words > max_words:
            chunks.append(current)
            current = current[-overlap_segments:] if overlap_segments else []
            words = sum(len(s["text"].split()) for s in current)
        current.append(seg)
        words += seg_words

    if current:
        chunks.append(current)

    return [
        {
            "start": c[0]["start"],
            "end": c[-1]["end"],
            "text": " ".join(s["text"].strip() for s in c),
        }
        for c in chunks
    ]


def call_llm(prompt, temperature=0.4, max_tokens=1500, max_retries=5):
    last_err = None
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            choice = response.choices[0]
            content = _clean(choice.message.content)
            if choice.finish_reason == "length":
                print(f"[summarizer] WARNING: output hit max_tokens ({max_tokens}); JSON may be cut off")
            if not content:
                last_err = RuntimeError("Model returned an empty response (likely consumed by reasoning tokens).")
                if attempt == max_retries - 1:
                    raise last_err
                print(f"[summarizer] Empty response received, retrying (attempt {attempt + 1}/{max_retries})...")
                max_tokens = min(max_tokens * 2, 6000)  # retry with a bigger budget
                time.sleep(2)
                continue
            return content
        except (RateLimitError, APITimeoutError, APIConnectionError) as e:
            last_err = e
            if attempt == max_retries - 1:
                raise
            wait_time = 2 ** attempt
            print(f"[summarizer] {type(e).__name__}, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})...")
            time.sleep(wait_time)
    raise last_err or RuntimeError("LLM call failed")


def _extract_json(raw):
    """Strip code fences and any text around the outermost JSON object."""
    raw = raw.replace("```json", "").replace("```", "").strip()
    start, end = raw.find("{"), raw.rfind("}")
    if start != -1 and end > start:
        raw = raw[start:end + 1]
    return raw


def process_transcript(segments, include_quiz=False, mcqs_per_chunk=MCQS_PER_CHUNK, short_answers_per_chunk=SHORT_ANSWERS_PER_CHUNK):
    """
    Single pass over the transcript: ONE LLM call per chunk produces
    technical_summary + simple_summary + glossary, and ALSO mcqs +
    short_answers when include_quiz=True — avoiding a second full pass
    and a second set of LLM calls for the quiz.

    Returns:
    {
        "chunks": [{"start","end","original","technical_summary","simple_summary","glossary"}, ...],
        "quiz_sections": [{"chunk_start","chunk_end","mcqs","short_answers"}, ...]   # only if include_quiz=True
    }
    """
    chunks = chunk_transcript(segments)
    results = []
    quiz_sections = []

    for i, chunk in enumerate(chunks):
        print(f"Processing chunk {i+1}/{len(chunks)} (combined call, include_quiz={include_quiz})...")

        prompt = prompts.combined_processing_prompt(
            chunk["text"],
            include_quiz=include_quiz,
            num_mcqs=mcqs_per_chunk,
            num_short_answers=short_answers_per_chunk,
        )
        raw = call_llm(prompt, temperature=0.4, max_tokens=3000 if include_quiz else 2000)
        raw = _extract_json(raw)

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"Warning: could not parse LLM response for chunk {i+1}: {e}")
            print(f"RAW RESPONSE WAS:\n{raw}\n{'='*50}")
            parsed = {"technical_summary": "", "simple_summary": "", "glossary": [], "mcqs": [], "short_answers": []}

        glossary = [t for t in parsed.get("glossary", []) if isinstance(t, dict)]
        for term in glossary:
            term["timestamp"] = round(chunk["start"], 1)

        results.append({
            "start": chunk["start"],
            "end": chunk["end"],
            "original": chunk["text"],
            "technical_summary": parsed.get("technical_summary", ""),
            "simple_summary": parsed.get("simple_summary", ""),
            "glossary": glossary
        })

        if include_quiz:
            mcqs = [q for q in parsed.get("mcqs", []) if isinstance(q, dict)]
            for q in mcqs:
                q["timestamp"] = round(chunk["start"], 1)
                q["type"] = "mcq"

            short_answers = [q for q in parsed.get("short_answers", []) if isinstance(q, dict)]
            for q in short_answers:
                q["timestamp"] = round(chunk["start"], 1)
                q["type"] = "short_answer"

            quiz_sections.append({
                "chunk_start": chunk["start"],
                "chunk_end": chunk["end"],
                "mcqs": mcqs,
                "short_answers": short_answers
            })

        if i < len(chunks) - 1:
            time.sleep(3)  # pacing buffer between chunks

    output = {"chunks": results}
    if include_quiz:
        output["quiz_sections"] = quiz_sections

    return output


def flatten_glossary(processed_result):
    seen_terms = set()
    flat_glossary = []

    for chunk in processed_result["chunks"]:
        for term in chunk["glossary"]:
            term_key = term.get("term", "").lower().strip()
            if not term_key or term_key in seen_terms:
                continue
            seen_terms.add(term_key)
            flat_glossary.append(term)

    return sorted(flat_glossary, key=lambda t: t["timestamp"])


def save_glossary(flat_glossary, output_path=GLOSSARY_PATH):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(flat_glossary, f, indent=2, ensure_ascii=False)
    print(f"Glossary saved to {output_path}")
    return output_path