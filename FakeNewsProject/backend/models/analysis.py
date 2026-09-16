from typing import Optional
from pydantic import BaseModel


class PredictRequest(BaseModel):
    title: Optional[str] = ""
    text: str


class CompareRequest(BaseModel):
    title_a: Optional[str] = "Article A"
    text_a: str
    title_b: Optional[str] = "Article B"
    text_b: str


class KeywordRequest(BaseModel):
    text: str
    keyword: str


class ReportRequest(BaseModel):
    title: str
    content: str
