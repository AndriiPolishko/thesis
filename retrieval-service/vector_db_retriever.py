from sentence_transformers import SentenceTransformer

from db import database

async def fetch_related_info_from_vector_db_based_on_last_message(last_message: str) -> list:
    # Model initialization
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    question_embedding = embedding_model.encode([last_message])

    retrieved_chunks = await database.retrieve_related_chunks(query_embedding=question_embedding, top_k=25)
    
    text_chunks = [item[0] for item in retrieved_chunks]

    return text_chunks