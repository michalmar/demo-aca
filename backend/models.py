from pydantic import BaseModel
from typing import List, Optional, Dict

class Question(BaseModel):
    id: str
    text: str
    type: str  # 'text' | 'multichoice' | 'scale'
    options: Optional[List[str]] = None
    scaleMax: Optional[int] = None

class Questionnaire(BaseModel):
    title: str
    description: str
    questions: List[Question]

class AnswersPayload(BaseModel):
    userId: str
    answers: Dict[str, str]

class StoredAnswers(BaseModel):
    userId: str
    answers: Dict[str, str]
