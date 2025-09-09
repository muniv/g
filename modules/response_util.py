from pydantic import BaseModel, Field

from typing import List, Dict, Optional, Union

class AnswerResponse(BaseModel):
    status: str = "success"
    msg: str = "success"
    data: Optional[str] = ""
    elapsed_time: Optional[float] = None

