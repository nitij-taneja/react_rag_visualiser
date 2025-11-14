"""
Pydantic models for API request/response validation
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class DocumentUploadRequest(BaseModel):
    """Request model for document upload"""
    title: str = Field(..., description="Document title")
    content: str = Field(..., description="Document content")
    mime_type: Optional[str] = Field(None, description="MIME type of document")


class DocumentResponse(BaseModel):
    """Response model for document"""
    id: int
    title: str
    content: str
    mime_type: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QueryRequest(BaseModel):
    """Request model for RAG query"""
    query: str = Field(..., description="User query")


class AgentStepResponse(BaseModel):
    """Response model for individual agent step"""
    type: str = Field(..., description="Step type: thought, action, observation, result")
    content: str = Field(..., description="Step content")
    timestamp: float = Field(..., description="Step timestamp")


class QueryResponse(BaseModel):
    """Response model for query processing"""
    success: bool
    result: str = Field(..., description="Final answer from agent")
    steps: List[AgentStepResponse] = Field(default_factory=list, description="Agent reasoning steps")
    error: Optional[str] = None


class QueryHistoryResponse(BaseModel):
    """Response model for query history"""
    id: int
    query: str
    result: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    version: str
    timestamp: datetime


class ErrorResponse(BaseModel):
    """Response model for errors"""
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None
