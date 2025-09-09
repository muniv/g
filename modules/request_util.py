from pydantic import BaseModel
from typing import List, Optional

class IntentRequest(BaseModel):
    query: str = ""
    context: Optional[str] = None

class EasyRequest(BaseModel):
    query: str = ""

class KeywordRequest(BaseModel):
    query: str = ""

class ChatRequest(BaseModel):
    history: Optional[list] = None
    query: str = ""

class SummarizationRequest(BaseModel):
    context: str = ""


    

    



    
