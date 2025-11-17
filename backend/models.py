from pydantic import BaseModel
from typing import Dict, List, Optional, Union, Literal


RightAnswer = Union[str, List[str]]


class AnswerDetail(BaseModel):
    value: Optional[str] = None
    correct: Optional[Literal["yes", "no"]] = None
    rightAnswer: Optional[RightAnswer] = None


class Question(BaseModel):
    id: str
    text: str
    type: str  # 'text' | 'multichoice' | 'scale'
    options: Optional[List[str]] = None
    scaleMax: Optional[int] = None
    rightAnswer: Optional[RightAnswer] = None

class Questionnaire(BaseModel):
    id: str
    title: str
    description: str
    questions: List[Question]

class AnswersPayload(BaseModel):
    questionnaireId: Optional[str] = None
    userId: str
    answers: Dict[str, AnswerDetail]

class StoredAnswers(BaseModel):
    questionnaireId: str
    userId: str
    answers: Dict[str, AnswerDetail]


class QuestionnaireCreate(Questionnaire):
    pass


class QuestionnaireUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[Question]] = None
