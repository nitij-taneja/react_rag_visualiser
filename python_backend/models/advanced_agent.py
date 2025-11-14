"""
Advanced ReAct RAG Agent with Multi-Tool Support
Extends basic agent with semantic search, caching, and tool composition
"""

from typing import List, Dict, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
import json
import asyncio
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
import hashlib


@dataclass
class Tool:
    """Represents an agent tool"""
    name: str
    description: str
    execute: Callable


@dataclass
class CacheEntry:
    """Cache entry for query results"""
    query: str
    result: str
    timestamp: float
    ttl: int = 3600  # 1 hour default


class AdvancedReactAgent:
    """
    Advanced ReAct Agent with:
    - Multiple tool support
    - Semantic search
    - Result caching
    - Tool composition
    - Performance metrics
    """

    def __init__(self, api_key: str, documents: Optional[Dict[str, str]] = None):
        self.api_key = api_key
        self.documents = documents or {}
        self.model = ChatGoogleGenerativeAI(
            api_key=api_key,
            model="gemini-pro",
            temperature=0.7,
        )
        self.tools: Dict[str, Tool] = {}
        self.cache: Dict[str, CacheEntry] = {}
        self.metrics = {
            "total_queries": 0,
            "cache_hits": 0,
            "avg_steps": 0,
            "total_time": 0,
        }
        self._register_default_tools()

    def _register_default_tools(self):
        """Register default tools"""
        self.register_tool(
            Tool(
                name="semantic_search",
                description="Search documents using semantic similarity",
                execute=self._semantic_search,
            )
        )
        self.register_tool(
            Tool(
                name="keyword_search",
                description="Search documents using keyword matching",
                execute=self._keyword_search,
            )
        )
        self.register_tool(
            Tool(
                name="summarize",
                description="Summarize document content",
                execute=self._summarize,
            )
        )
        self.register_tool(
            Tool(
                name="compare",
                description="Compare multiple documents",
                execute=self._compare,
            )
        )

    def register_tool(self, tool: Tool):
        """Register a new tool"""
        self.tools[tool.name] = tool

    def _semantic_search(self, query: str, top_k: int = 3) -> str:
        """
        Semantic search - simple implementation
        In production, use embeddings library
        """
        query_lower = query.lower()
        query_words = set(query_lower.split())

        scored_docs = []
        for title, content in self.documents.items():
            content_lower = content.lower()
            title_lower = title.lower()

            # Score based on word overlap
            content_words = set(content_lower.split())
            title_words = set(title_lower.split())

            overlap = len(query_words & content_words) + len(query_words & title_words) * 2
            if overlap > 0:
                scored_docs.append((title, content, overlap))

        # Sort by score and return top-k
        scored_docs.sort(key=lambda x: x[2], reverse=True)
        results = []
        for title, content, score in scored_docs[:top_k]:
            results.append(f"[{title}] (relevance: {score})\n{content[:400]}...")

        return "\n\n---\n\n".join(results) if results else "No semantically similar documents found."

    def _keyword_search(self, keywords: str) -> str:
        """Keyword-based search"""
        keywords_list = keywords.lower().split(",")
        results = []

        for title, content in self.documents.items():
            if any(kw.strip() in title.lower() or kw.strip() in content.lower() for kw in keywords_list):
                results.append(f"[{title}]\n{content[:400]}...")

        return "\n\n---\n\n".join(results) if results else "No documents found for keywords."

    def _summarize(self, title: str) -> str:
        """Summarize a specific document"""
        if title in self.documents:
            content = self.documents[title]
            # Simple summarization - take first 200 chars
            return f"Summary of {title}:\n{content[:200]}..."
        return f"Document '{title}' not found."

    def _compare(self, titles: str) -> str:
        """Compare multiple documents"""
        title_list = [t.strip() for t in titles.split(",")]
        comparison = "Comparison:\n"

        for title in title_list:
            if title in self.documents:
                content = self.documents[title]
                comparison += f"\n{title}:\n{content[:150]}...\n"

        return comparison if len(title_list) > 1 else "Please provide multiple document titles."

    def _get_cache_key(self, query: str) -> str:
        """Generate cache key for query"""
        return hashlib.md5(query.encode()).hexdigest()

    def _check_cache(self, query: str) -> Optional[str]:
        """Check if query result is cached"""
        cache_key = self._get_cache_key(query)
        if cache_key in self.cache:
            entry = self.cache[cache_key]
            if datetime.now().timestamp() - entry.timestamp < entry.ttl:
                self.metrics["cache_hits"] += 1
                return entry.result
            else:
                del self.cache[cache_key]
        return None

    def _cache_result(self, query: str, result: str):
        """Cache query result"""
        cache_key = self._get_cache_key(query)
        self.cache[cache_key] = CacheEntry(
            query=query,
            result=result,
            timestamp=datetime.now().timestamp(),
        )

    def get_tools_description(self) -> str:
        """Get formatted tools description"""
        return "\n".join(
            [f"- {tool.name}: {tool.description}" for tool in self.tools.values()]
        )

    async def process_query_advanced(self, query: str, use_cache: bool = True) -> Dict:
        """
        Process query with advanced features
        Includes caching, tool composition, and metrics
        """
        start_time = datetime.now().timestamp()

        # Check cache
        if use_cache:
            cached_result = self._check_cache(query)
            if cached_result:
                return {
                    "result": cached_result,
                    "steps": [
                        {
                            "type": "result",
                            "content": "Result retrieved from cache",
                            "timestamp": start_time,
                        }
                    ],
                    "from_cache": True,
                    "time_ms": (datetime.now().timestamp() - start_time) * 1000,
                }

        steps = []

        def add_step(step_type: str, content: str):
            steps.append(
                {
                    "type": step_type,
                    "content": content,
                    "timestamp": datetime.now().timestamp(),
                }
            )

        add_step("thought", f'Processing query: "{query}"')

        # Build system prompt with all tools
        system_prompt = f"""You are an advanced ReAct agent with access to multiple tools.

Available tools:
{self.get_tools_description()}

Follow the ReAct pattern:
1. Thought: Analyze what you need
2. Action: Choose and use a tool
3. Observation: Process the result
4. Repeat or provide final answer

Be strategic about tool selection. Combine tools when needed."""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=query),
        ]

        max_iterations = 6
        iterations = 0
        final_answer = ""

        while iterations < max_iterations:
            iterations += 1

            try:
                response = await self.model.ainvoke(messages)
                content = response.content if hasattr(response, "content") else str(response)

                add_step("thought", content)

                # Check for final answer
                if "final answer" in content.lower() or iterations >= max_iterations:
                    final_answer = content
                    add_step("result", final_answer)
                    break

                # Parse tool calls
                tool_executed = False

                for tool_name in self.tools.keys():
                    if tool_name in content.lower():
                        add_step("action", f"Using tool: {tool_name}")

                        # Extract parameters (simple extraction)
                        import re

                        param_match = re.search(
                            rf"{tool_name}\s*\(([^)]+)\)", content, re.IGNORECASE
                        )
                        params = param_match.group(1) if param_match else query

                        # Execute tool
                        result = self.tools[tool_name].execute(params)
                        add_step("observation", result)

                        messages.append(HumanMessage(content=content))
                        messages.append(
                            HumanMessage(
                                content=f"Tool result:\n{result}\n\nContinue your analysis."
                            )
                        )
                        tool_executed = True
                        break

                if not tool_executed:
                    final_answer = content
                    add_step("result", final_answer)
                    break

            except Exception as e:
                add_step("thought", f"Error: {str(e)}")
                break

        # Update metrics
        elapsed_time = datetime.now().timestamp() - start_time
        self.metrics["total_queries"] += 1
        self.metrics["total_time"] += elapsed_time
        self.metrics["avg_steps"] = (
            self.metrics["avg_steps"] * (self.metrics["total_queries"] - 1) + len(steps)
        ) / self.metrics["total_queries"]

        # Cache result
        if final_answer:
            self._cache_result(query, final_answer)

        return {
            "result": final_answer or "Unable to process query",
            "steps": steps,
            "from_cache": False,
            "time_ms": elapsed_time * 1000,
            "iterations": iterations,
            "metrics": {
                "total_queries": self.metrics["total_queries"],
                "cache_hits": self.metrics["cache_hits"],
                "avg_steps": round(self.metrics["avg_steps"], 2),
            },
        }

    def get_metrics(self) -> Dict:
        """Get performance metrics"""
        return {
            "total_queries": self.metrics["total_queries"],
            "cache_hits": self.metrics["cache_hits"],
            "cache_hit_rate": (
                self.metrics["cache_hits"] / self.metrics["total_queries"]
                if self.metrics["total_queries"] > 0
                else 0
            ),
            "avg_steps": round(self.metrics["avg_steps"], 2),
            "avg_time_ms": (
                (self.metrics["total_time"] / self.metrics["total_queries"]) * 1000
                if self.metrics["total_queries"] > 0
                else 0
            ),
        }

    def update_documents(self, documents: Dict[str, str]):
        """Update knowledge base"""
        self.documents = documents
