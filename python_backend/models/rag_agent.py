"""
ReAct RAG Agent System
Implements Reasoning + Acting pattern with document retrieval using LangChain and Gemini
"""

from typing import List, Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
import json
import re


@dataclass
class AgentStep:
    """Represents a single step in the agent's reasoning process"""
    type: str  # "thought", "action", "observation", "result"
    content: str
    timestamp: float = field(default_factory=lambda: datetime.now().timestamp())


@dataclass
class AgentState:
    """Tracks the current state of the agent"""
    steps: List[AgentStep] = field(default_factory=list)
    current_query: str = ""
    documents: List[str] = field(default_factory=list)
    is_processing: bool = False


class ReactRagAgent:
    """
    ReAct (Reasoning + Acting) RAG Agent using LangChain and Gemini
    Visualizes agent thought process in real-time
    """

    def __init__(self, api_key: str, documents: Optional[Dict[str, str]] = None):
        """
        Initialize the ReAct RAG Agent
        
        Args:
            api_key: Gemini API key
            documents: Dictionary mapping document titles to content
        """
        self.api_key = api_key
        self.documents = documents or {}
        self.model = ChatGoogleGenerativeAI(
            api_key=api_key,
            model="gemini-2.5-flash",
            temperature=0.7,
        )
        self.state = AgentState()
        self.max_iterations = 5

    def add_step(self, step_type: str, content: str) -> None:
        """Add a reasoning step to the state"""
        self.state.steps.append(
            AgentStep(type=step_type, content=content)
        )

    def retrieve_documents(self, query: str) -> str:
        """
        Retrieve relevant documents based on query keywords

        Args:
            query: Search query

        Returns:
            Retrieved document content or "No relevant documents found"
        """
        query_lower = query.lower()

        # Extract keywords from query (remove common words)
        stop_words = {'is', 'in', 'the', 'a', 'an', 'which', 'what', 'where', 'when', 'who', 'how', 'are', 'was', 'were'}
        keywords = [word.lower() for word in query.split() if word.lower() not in stop_words and len(word) > 2]

        results = []
        scored_docs = []

        for title, content in self.documents.items():
            title_lower = title.lower()
            content_lower = content.lower()
            score = 0

            # Score based on keyword matches
            for keyword in keywords:
                if keyword in title_lower:
                    score += 10  # Title matches are more important
                if keyword in content_lower:
                    score += content_lower.count(keyword)

            # Also check if full query appears
            if query_lower in title_lower or query_lower in content_lower:
                score += 20

            if score > 0:
                scored_docs.append((score, title, content))

        # Sort by score (highest first) and take top results
        scored_docs.sort(reverse=True, key=lambda x: x[0])

        for score, title, content in scored_docs[:3]:  # Top 3 documents
            # Return full content if short, otherwise truncate
            if len(content) <= 1000:
                results.append(f"[Document: {title}]\n{content}")
            else:
                results.append(f"[Document: {title}]\n{content[:1000]}...")

        return "\n\n---\n\n".join(results) if results else "No relevant documents found."

    def analyze_text(self, text: str, query: str) -> str:
        """
        Analyze and extract key information from text
        
        Args:
            text: Text to analyze
            query: Original query for context
            
        Returns:
            Key findings extracted from the text
        """
        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]

        # Find sentences relevant to query
        query_words = query.split()
        relevant = [
            s for s in sentences
            if any(word.lower() in s.lower() for word in query_words)
        ]

        if relevant:
            return f"Key findings:\n" + "\n".join(relevant[:3])
        else:
            return "No specific findings related to the query."

    async def process_query(self, query: str) -> Dict:
        """
        Process a query using the ReAct pattern
        
        Args:
            query: User query
            
        Returns:
            Dictionary with result and steps
        """
        # Reset state
        self.state = AgentState(
            current_query=query,
            is_processing=True
        )

        self.add_step("thought", f'Analyzing query: "{query}"')

        # First, always retrieve documents
        self.add_step("action", f'Retrieving documents related to: "{query}"')
        retrieved_docs = self.retrieve_documents(query)
        print(f"[RAG Agent] Retrieved docs length: {len(retrieved_docs)}")
        print(f"[RAG Agent] Retrieved docs preview: {retrieved_docs[:200]}")
        self.add_step("observation", f"Retrieved documents:\n{retrieved_docs}")

        # System prompt for ReAct pattern
        system_prompt = """You are a helpful assistant that answers questions based on the provided documents.

Your task:
1. Read the retrieved documents carefully
2. Find information relevant to the user's question
3. Provide a clear, accurate answer based ONLY on the information in the documents
4. If the documents don't contain the answer, say so clearly

Be concise and direct in your answer."""

        # Build the prompt with retrieved documents
        user_prompt = f"""Question: {query}

Retrieved Documents:
{retrieved_docs}

Based on the documents above, please answer the question. If the documents don't contain enough information to answer the question, say so clearly."""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ]

        try:
            # Get model response
            self.add_step("action", "Analyzing documents and formulating answer...")
            print(f"[RAG Agent] Invoking model with {len(messages)} messages")
            response = await self._invoke_model(messages)
            final_answer = response.content if hasattr(response, 'content') else str(response)
            print(f"[RAG Agent] Got response: {final_answer[:100] if final_answer else 'No response'}")

            self.add_step("thought", f"Analysis complete. Formulating final answer...")
            self.add_step("result", final_answer)

        except Exception as e:
            error_msg = str(e)
            print(f"[RAG Agent] Error: {error_msg}")
            import traceback
            traceback.print_exc()
            self.add_step("thought", f"Error during processing: {error_msg}")
            final_answer = f"Error processing query: {error_msg}"
            self.add_step("result", final_answer)

        self.state.is_processing = False

        return {
            "result": final_answer or "Unable to generate a complete answer. Please try again.",
            "steps": [
                {
                    "type": step.type,
                    "content": step.content,
                    "timestamp": step.timestamp
                }
                for step in self.state.steps
            ]
        }

    async def _invoke_model(self, messages):
        """Invoke the Gemini model with messages"""
        return await self.model.ainvoke(messages)

    def update_documents(self, documents: Dict[str, str]) -> None:
        """Update the knowledge base with new documents"""
        self.documents = documents

    def get_state(self) -> Dict:
        """Get current agent state"""
        return {
            "steps": [
                {
                    "type": step.type,
                    "content": step.content,
                    "timestamp": step.timestamp
                }
                for step in self.state.steps
            ],
            "current_query": self.state.current_query,
            "documents": self.state.documents,
            "is_processing": self.state.is_processing
        }
