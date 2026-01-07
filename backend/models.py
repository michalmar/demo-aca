from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union, Literal


RightAnswer = Union[str, List[str]]
QuestionnaireType = Literal["question", "test", "flashcard"]


class AnswerDetail(BaseModel):
    value: Optional[str] = None
    correct: Optional[Literal["yes", "no"]] = None
    rightAnswer: Optional[RightAnswer] = None
    revealed: Optional[bool] = None


class Question(BaseModel):
    id: str
    text: str
    type: str  # 'text' | 'multichoice' | 'scale'
    options: Optional[List[str]] = None
    scaleMax: Optional[int] = None
    rightAnswer: Optional[RightAnswer] = None

class Questionnaire(BaseModel):
    model_config = {
        "populate_by_name": True,
    }

    id: str
    title: str
    description: str
    questions: List[Question]
    type: QuestionnaireType = Field(default="question", alias="questionnaireType")

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
    model_config = {
        "populate_by_name": True,
    }

    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[Question]] = None
    type: Optional[QuestionnaireType] = Field(default=None, alias="questionnaireType")


class UploadedImage(BaseModel):
    """An optional screenshot-like image provided with topic upload."""

    filename: Optional[str] = None
    # Expected to be a data URL: data:image/<type>;base64,<...>
    dataUrl: str


class TopicUploadRequest(BaseModel):
    """Request model for uploading a new topic to generate content."""
    topicName: str
    topicText: str
    images: Optional[List[UploadedImage]] = None


class TopicUploadResponse(BaseModel):
    """Response model for topic upload with generated content."""
    success: bool
    message: str
    flashcardId: Optional[str] = None
    testId: Optional[str] = None


class PaginatedAnswersResponse(BaseModel):
    """Response model for paginated list of answers."""
    items: List[StoredAnswers]
    total: int
    page: int
    pageSize: int
    totalPages: int
