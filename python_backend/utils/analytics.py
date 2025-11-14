"""
Analytics and Performance Monitoring
Tracks system metrics and provides insights
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import json


@dataclass
class QueryMetrics:
    """Metrics for a single query"""
    query_id: str
    query: str
    timestamp: float
    duration_ms: float
    steps_count: int
    success: bool
    from_cache: bool
    error: Optional[str] = None


@dataclass
class SystemMetrics:
    """Overall system metrics"""
    total_queries: int = 0
    successful_queries: int = 0
    failed_queries: int = 0
    cache_hits: int = 0
    total_documents: int = 0
    avg_query_time_ms: float = 0.0
    avg_steps_per_query: float = 0.0
    uptime_seconds: float = 0.0


class AnalyticsEngine:
    """
    Tracks and analyzes system performance
    """

    def __init__(self):
        self.query_history: List[QueryMetrics] = []
        self.system_metrics = SystemMetrics()
        self.start_time = datetime.now()

    def record_query(
        self,
        query_id: str,
        query: str,
        duration_ms: float,
        steps_count: int,
        success: bool,
        from_cache: bool = False,
        error: Optional[str] = None,
    ):
        """Record a query execution"""
        metrics = QueryMetrics(
            query_id=query_id,
            query=query,
            timestamp=datetime.now().timestamp(),
            duration_ms=duration_ms,
            steps_count=steps_count,
            success=success,
            from_cache=from_cache,
            error=error,
        )
        self.query_history.append(metrics)
        self._update_system_metrics()

    def _update_system_metrics(self):
        """Update aggregated system metrics"""
        if not self.query_history:
            return

        total = len(self.query_history)
        successful = sum(1 for q in self.query_history if q.success)
        failed = total - successful
        cache_hits = sum(1 for q in self.query_history if q.from_cache)
        avg_time = sum(q.duration_ms for q in self.query_history) / total
        avg_steps = sum(q.steps_count for q in self.query_history) / total
        uptime = (datetime.now() - self.start_time).total_seconds()

        self.system_metrics = SystemMetrics(
            total_queries=total,
            successful_queries=successful,
            failed_queries=failed,
            cache_hits=cache_hits,
            avg_query_time_ms=avg_time,
            avg_steps_per_query=avg_steps,
            uptime_seconds=uptime,
        )

    def get_system_metrics(self) -> Dict:
        """Get current system metrics"""
        return {
            "total_queries": self.system_metrics.total_queries,
            "successful_queries": self.system_metrics.successful_queries,
            "failed_queries": self.system_metrics.failed_queries,
            "success_rate": (
                self.system_metrics.successful_queries / self.system_metrics.total_queries
                if self.system_metrics.total_queries > 0
                else 0
            ),
            "cache_hits": self.system_metrics.cache_hits,
            "cache_hit_rate": (
                self.system_metrics.cache_hits / self.system_metrics.total_queries
                if self.system_metrics.total_queries > 0
                else 0
            ),
            "avg_query_time_ms": round(self.system_metrics.avg_query_time_ms, 2),
            "avg_steps_per_query": round(self.system_metrics.avg_steps_per_query, 2),
            "uptime_seconds": round(self.system_metrics.uptime_seconds, 2),
        }

    def get_query_history(self, limit: int = 50) -> List[Dict]:
        """Get recent query history"""
        recent = self.query_history[-limit:]
        return [
            {
                "query_id": q.query_id,
                "query": q.query[:100],  # Truncate for display
                "timestamp": datetime.fromtimestamp(q.timestamp).isoformat(),
                "duration_ms": round(q.duration_ms, 2),
                "steps": q.steps_count,
                "success": q.success,
                "from_cache": q.from_cache,
                "error": q.error,
            }
            for q in recent
        ]

    def get_performance_trends(self, window_minutes: int = 60) -> Dict:
        """Get performance trends over time window"""
        cutoff_time = datetime.now().timestamp() - (window_minutes * 60)
        recent_queries = [q for q in self.query_history if q.timestamp >= cutoff_time]

        if not recent_queries:
            return {
                "window_minutes": window_minutes,
                "queries_in_window": 0,
                "avg_time_ms": 0,
                "success_rate": 0,
            }

        avg_time = sum(q.duration_ms for q in recent_queries) / len(recent_queries)
        success_rate = sum(1 for q in recent_queries if q.success) / len(recent_queries)

        return {
            "window_minutes": window_minutes,
            "queries_in_window": len(recent_queries),
            "avg_time_ms": round(avg_time, 2),
            "success_rate": round(success_rate, 3),
        }

    def get_top_queries(self, limit: int = 10) -> List[Dict]:
        """Get most frequently asked queries"""
        query_counts: Dict[str, int] = {}
        for q in self.query_history:
            query_counts[q.query] = query_counts.get(q.query, 0) + 1

        top_queries = sorted(query_counts.items(), key=lambda x: x[1], reverse=True)[
            :limit
        ]
        return [{"query": q[0], "count": q[1]} for q in top_queries]

    def get_slowest_queries(self, limit: int = 10) -> List[Dict]:
        """Get slowest query executions"""
        sorted_queries = sorted(
            self.query_history, key=lambda x: x.duration_ms, reverse=True
        )[:limit]
        return [
            {
                "query": q.query[:100],
                "duration_ms": round(q.duration_ms, 2),
                "timestamp": datetime.fromtimestamp(q.timestamp).isoformat(),
            }
            for q in sorted_queries
        ]

    def export_metrics(self) -> str:
        """Export metrics as JSON"""
        return json.dumps(
            {
                "system_metrics": self.get_system_metrics(),
                "performance_trends": self.get_performance_trends(),
                "top_queries": self.get_top_queries(),
                "slowest_queries": self.get_slowest_queries(),
                "exported_at": datetime.now().isoformat(),
            },
            indent=2,
        )


# Global analytics instance
analytics_engine = AnalyticsEngine()
