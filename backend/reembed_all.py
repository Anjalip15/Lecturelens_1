import json
from api.supabase_client import supabase
from api.services.rag_service import generate_and_store_embeddings

rows = supabase.table("lectures").select("id, full_transcript").execute().data

for r in rows:
    if not r.get("full_transcript"):
        print(f"{r['id']}: no transcript, skipped")
        continue
    try:
        segments = json.loads(r["full_transcript"])
        n = generate_and_store_embeddings(r["id"], segments)
        print(f"{r['id']}: {n} chunks")
    except Exception as e:
        print(f"{r['id']}: FAILED - {e}")