from openai import AsyncOpenAI

class QueryExpansion:
  def __init__(self):
    self.openai_client = AsyncOpenAI()
    self.openai_model = "gpt-4o"

  async def query_expansion(self, original_query: str, thread):
    '''Generate multiple search queries based on the original query and the thread'''
    
    messages = [
      {"role": "system", "content": "You are a helpful assistant that generates multiple search queries based on a single input query, being the email of the lead."},
      {"role": "user", "content": f"For additional context, here is the conversation history: {thread}"},
      {"role": "user", "content": f"Generate multiple search queries related to: {original_query}. OUTPUT (4 queries). Separate each query with a new line. Do not add any other text or numbers before queries."},
    ]
    completion = await self.openai_client.chat.completions.create(
      model=self.openai_model,
      messages=messages
    )
    
    generated_queries = completion.choices[0].message.content.split('\n')
    generated_queries = [query.strip() for query in generated_queries if query.strip()]
    
    return generated_queries
  
query_expansion = QueryExpansion()