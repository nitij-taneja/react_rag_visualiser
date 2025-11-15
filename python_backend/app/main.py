"""
FastAPI application for ReAct RAG system
Provides REST and WebSocket endpoints for document management and query processing
"""

import os
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Dict, List, Optional
import json
import logging

from models.rag_agent import ReactRagAgent
from models.schemas import (
    DocumentUploadRequest,
    QueryRequest,
    QueryResponse,
    AgentStepResponse,
    HealthResponse,
    ErrorResponse,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ReAct RAG Visualizer",
    description="Real-time visualization of ReAct RAG agent reasoning",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG agent
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
rag_agent = ReactRagAgent(api_key=GEMINI_API_KEY)

# In-memory storage for documents and queries
documents_db: Dict[str, str] = {}
queries_history: List[Dict] = []


@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("ReAct RAG Visualizer API starting...")
    logger.info(f"Gemini API configured: {bool(GEMINI_API_KEY)}")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now()
    }


@app.post("/api/documents/upload")
async def upload_document(request: DocumentUploadRequest):
    """
    Upload a document to the knowledge base

    Args:
        request: Document upload request with title and content

    Returns:
        Success response with document ID
    """
    try:
        doc_id = len(documents_db) + 1
        documents_db[request.title] = request.content

        # Update agent with new documents
        rag_agent.update_documents(documents_db)

        logger.info(f"Document uploaded: {request.title}")

        return {
            "success": True,
            "message": f"Document '{request.title}' uploaded successfully",
            "document_id": doc_id
        }
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/documents/upload-file")
async def upload_document_file(file: UploadFile = File(...)):
    """
    Upload a document file to the knowledge base

    Args:
        file: Uploaded file

    Returns:
        Success response with document ID
    """
    try:
        # Read file content
        content = await file.read()

        # Decode based on file type
        try:
            text_content = content.decode('utf-8')
        except UnicodeDecodeError:
            # Try other encodings
            try:
                text_content = content.decode('latin-1')
            except:
                raise HTTPException(status_code=400, detail="Unable to decode file. Please upload a text file.")

        # Use filename as title
        title = file.filename or f"Document_{len(documents_db) + 1}"

        doc_id = len(documents_db) + 1
        documents_db[title] = text_content

        # Update agent with new documents
        rag_agent.update_documents(documents_db)

        logger.info(f"File uploaded: {title}")

        return {
            "success": True,
            "message": f"File '{title}' uploaded successfully",
            "document_id": doc_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/documents")
async def get_documents():
    """Get all uploaded documents"""
    try:
        documents = [
            {
                "title": title,
                "content_preview": content[:200] + "..." if len(content) > 200 else content,
                "size": len(content)
            }
            for title, content in documents_db.items()
        ]
        return {
            "success": True,
            "documents": documents,
            "count": len(documents)
        }
    except Exception as e:
        logger.error(f"Error getting documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    Process a query using the ReAct RAG agent
    
    Args:
        request: Query request with user query
        
    Returns:
        Query response with result and reasoning steps
    """
    try:
        logger.info(f"Processing query: {request.query}")
        logger.info(f"Documents in DB: {list(documents_db.keys())}")

        # Process query with agent
        result = await rag_agent.process_query(request.query)

        logger.info(f"Query result: {result['result'][:100] if result['result'] else 'No result'}")
        logger.info(f"Number of steps: {len(result['steps'])}")

        # Store in history
        query_record = {
            "query": request.query,
            "result": result["result"],
            "steps": result["steps"],
            "timestamp": datetime.now().isoformat()
        }
        queries_history.append(query_record)

        # Format response
        steps = [
            AgentStepResponse(
                type=step["type"],
                content=step["content"],
                timestamp=step["timestamp"]
            )
            for step in result["steps"]
        ]

        logger.info(f"Returning response with {len(steps)} steps")

        return QueryResponse(
            success=True,
            result=result["result"],
            steps=steps
        )

    except Exception as e:
        logger.error(f"Error processing query: {str(e)}", exc_info=True)
        return QueryResponse(
            success=False,
            result="",
            steps=[],
            error=str(e)
        )


@app.get("/api/queries/history")
async def get_query_history():
    """Get query history"""
    try:
        return {
            "success": True,
            "queries": queries_history,
            "count": len(queries_history)
        }
    except Exception as e:
        logger.error(f"Error getting query history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/query")
async def websocket_query(websocket: WebSocket):
    """
    WebSocket endpoint for real-time query processing
    Streams agent steps as they are generated
    """
    await websocket.accept()
    logger.info("WebSocket connection established")

    try:
        while True:
            # Receive query from client
            data = await websocket.receive_text()
            query_data = json.loads(data)
            query = query_data.get("query", "")

            if not query:
                await websocket.send_json({
                    "type": "error",
                    "content": "Query cannot be empty"
                })
                continue

            logger.info(f"WebSocket query: {query}")

            # Process query and stream steps
            result = await rag_agent.process_query(query)

            # Send each step to client
            for step in result["steps"]:
                await websocket.send_json({
                    "type": "step",
                    "step_type": step["type"],
                    "content": step["content"],
                    "timestamp": step["timestamp"]
                })

            # Send final result
            await websocket.send_json({
                "type": "result",
                "content": result["result"]
            })

            # Send completion signal
            await websocket.send_json({
                "type": "complete"
            })

    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        try:
            await websocket.send_json({
                "type": "error",
                "content": str(e)
            })
        except:
            pass
        finally:
            await websocket.close()


@app.get("/api/agent/state")
async def get_agent_state():
    """Get current agent state"""
    try:
        state = rag_agent.get_state()
        return {
            "success": True,
            "state": state
        }
    except Exception as e:
        logger.error(f"Error getting agent state: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
