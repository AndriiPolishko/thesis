from fastapi import FastAPI
import uvicorn
import os

from src.controller import router

app = FastAPI()

app.include_router(router)

if __name__ == '__main__':
  # TODO: check why getting from env file is not working
  port = int(os.environ.get('PORT', 8080))
  host = os.environ.get('HOST', '0.0.0.0')
  
  uvicorn.run(app, port=port, host=host, reload=True)