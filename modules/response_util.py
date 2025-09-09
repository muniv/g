from pydantic import BaseModel, Field

from typing import List, Dict, Optional, Union

class IntentResponse(BaseModel):
    status: str = "success"
    msg: str = "success"
    data: Optional[bool] = ""
    elapsed_time: Optional[float] = None

class EasyResponse(BaseModel):
    status: str = "success"
    msg: str = "success"
    data: Optional[str] = ""
    elapsed_time: Optional[float] = None

class KeywordResponse(BaseModel):
    status: str = "success"
    msg: str = "success"
    data: Optional[list] = []
    elapsed_time: Optional[float] = None

class ChatResponse(BaseModel):
    status: str = "success"
    msg: str = "success"
    data: Optional[str] = ""
    elapsed_time: Optional[float] = None

class SummarizationResponse(BaseModel):
    status: str = "success"
    msg: str = "success"
    data: Optional[str] = ""
    elapsed_time: Optional[float] = None






