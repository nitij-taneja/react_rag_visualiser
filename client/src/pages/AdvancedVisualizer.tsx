import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, Activity, Zap, TrendingUp, Clock } from "lucide-react";

interface PerformanceMetrics {
  total_queries: number;
  successful_queries: number;
  failed_queries: number;
  success_rate: number;
  cache_hits: number;
  cache_hit_rate: number;
  avg_query_time_ms: number;
  avg_steps_per_query: number;
  uptime_seconds: number;
}

interface PerformanceTrend {
  window_minutes: number;
  queries_in_window: number;
  avg_time_ms: number;
  success_rate: number;
}

export default function AdvancedVisualizer() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [trends, setTrends] = useState<PerformanceTrend | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/metrics");
        const data = await response.json();
        if (data.success) {
          setMetrics(data.metrics);
          setTrends(data.trends);
        }
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Advanced Analytics Dashboard
        </h1>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="cache">Cache Stats</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Total Queries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{metrics?.total_queries || 0}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {metrics?.successful_queries || 0} successful
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {((metrics?.success_rate || 0) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {metrics?.failed_queries || 0} failed
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    Avg Query Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {(metrics?.avg_query_time_ms || 0).toFixed(0)}ms
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {(metrics?.avg_steps_per_query || 0).toFixed(1)} steps
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    Cache Hit Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {((metrics?.cache_hit_rate || 0) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {metrics?.cache_hits || 0} hits
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>Last 60 minutes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <p className="text-sm text-slate-400">Queries in Window</p>
                    <p className="text-2xl font-bold mt-2">
                      {trends?.queries_in_window || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <p className="text-sm text-slate-400">Avg Response Time</p>
                    <p className="text-2xl font-bold mt-2">
                      {(trends?.avg_time_ms || 0).toFixed(0)}ms
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cache Stats Tab */}
          <TabsContent value="cache" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Cache Performance
                </CardTitle>
                <CardDescription>Query result caching statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <p className="text-sm text-slate-400">Total Cache Hits</p>
                    <p className="text-2xl font-bold mt-2">{metrics?.cache_hits || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <p className="text-sm text-slate-400">Hit Rate</p>
                    <p className="text-2xl font-bold mt-2">
                      {((metrics?.cache_hit_rate || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-4">
                  Caching reduces query latency by storing frequently asked questions and their results.
                  Higher hit rates indicate better performance for repeated queries.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* System Health */}
        <Card className="bg-slate-800 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <span className="text-sm">Uptime</span>
                <span className="font-mono text-sm">
                  {metrics && formatUptime(metrics.uptime_seconds)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <span className="text-sm">Status</span>
                <span className="inline-flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-400">Healthy</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
