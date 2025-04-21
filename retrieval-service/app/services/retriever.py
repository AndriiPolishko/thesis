import requests
import logging
from sentence_transformers import SentenceTransformer

from collections import defaultdict

from config import COHERE_API_KEY
from database.db import database
from services.query_expansion import query_expansion


class Retriever:
  def __init__(self):
    self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    self.rerank_endpoint = "https://api.cohere.com/v2/rerank"
    self.rerank_model = "rerank-v3.5"

  async def retrieve(self, initial_query: str, thread: str):
    '''Main function to retrieve the chunks'''
    
    # Get the expanded queries
    expanded_queries = await query_expansion.query_expansion(initial_query, thread)
    expanded_queries = [initial_query, *expanded_queries]
    
    # Get the chunks for each query
    list_of_lists_of_chunks = []
    
    for query in expanded_queries:
      retrieved_chunks = await self._hybrid_retrieval(query)
      
      list_of_lists_of_chunks.append(retrieved_chunks) 
    
    # Rerank the chunks using RRF
    reranked_chunks = self._rrf_fusion(list_of_lists_of_chunks)
    top_10_chunks = reranked_chunks[:10]
    # Rerank the chunks using Cohere
    reranked_chunks_with_cohere = await self._rerank_chunks(initial_query, top_10_chunks)
    
    return reranked_chunks_with_cohere

  async def _hybrid_retrieval(self, query_text: str) -> list:
    '''Get the embedded text from the vector database'''
    
    query_embedding = self.embedding_model.encode(query_text)
    semantic_retrieval_results = await database.semantic_retrieval(query_embedding)
    key_word_retrieval_results = await database.key_word_retrieval(query_text)
    combined_results = [*semantic_retrieval_results, *key_word_retrieval_results]
    # Remove duplicates
    combined_results = list(set(combined_results))

    return combined_results
  
  async def _rerank_chunks(self, query: str, chunks: list):
    '''Rerank the chunks using Cohere'''
    
    # Calculate the number of chunks to return from cohere. Get the top 30% of the chunks but max 10 and min 5
    top_n = max(5, min(10, int(0.3 * len(chunks))))
    headers = {
        "Authorization": f"Bearer {COHERE_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": self.rerank_model,
        "query": query,
        "documents": chunks,
        "top_n": top_n
    }
    
    try:
      res = requests.post(self.rerank_endpoint, headers=headers, json=data)
      
      res.raise_for_status()
      
      res_json = res.json()
      results = res_json['results']
      ids_to_return = [ell['index'] for ell in results]
      reranked_chunks = [chunks[i] for i in ids_to_return]
    
      return reranked_chunks
  
    except Exception as e:
      logging.error(f"Error in reranking chunks: {e}")
      
      return chunks
  
  def _rrf_fusion(self, retriever_results, k=60):
    """
    Apply Reciprocal Rank Fusion (RRF) to the given lists of retrieved documents.

    Parameters:
        retriever_results (List[List[str]]): A list of lists of document strings from each retriever.
        k (int): RRF constant to control the weight decay for lower ranks.

    Returns:
        List[Tuple[str, float]]: List of tuples (document, rrf_score), sorted by score descending.
    """
    scores = defaultdict(float)

    for retriever_res in retriever_results:
        for rank, doc in enumerate(retriever_res):
            # Use rank+1 to make ranks 1-based
            scores[doc] += 1 / (k + rank + 1)

    # Sort documents by score, descending
    ranked_docs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    
    ranked_docs_without_scores = [doc[0] for doc in ranked_docs]
        
    return ranked_docs_without_scores
  
retriever = Retriever()