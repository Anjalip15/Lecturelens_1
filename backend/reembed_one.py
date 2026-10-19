import json
import sys
from api.supabase_client import supabase
from api.services.rag_service import generate_and_store_embeddings

lecture_id = sys.argv[1]
row = supabase.table("lectures").select("id, full_transcript").eq("id", lecture_id).execute().data[0]
segments = json.loads(row["full_transcript"])
n = generate_and_store_embeddings(lecture_id, segments)
print(f"{lecture_id}: {n} chunks stored")