import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Zap, Eye, FileText, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ReAct RAG
            </span>
          </div>

          <div>
            <Link href="/visualizer">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Open Visualizer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Watch AI Think in
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}Real-Time
              </span>
            </h1>
            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              Visualize the complete reasoning process of ReAct agents. See how they retrieve documents, analyze information, and reach conclusions—all in an interactive slideshow interface.
            </p>
            <div className="flex gap-4">
              <Link href="/visualizer">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8">
                  Start Exploring
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800 text-lg px-8">
                  Learn More
                </Button>
              </a>
            </div>
          </div>

          {/* Hero Visualization */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-3xl opacity-20" />
            <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700 border-opacity-30">
                  <Brain className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">Thought: Analyzing query...</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-900 bg-opacity-30 rounded-lg border border-yellow-700 border-opacity-30">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm">Action: Retrieving documents...</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-900 bg-opacity-30 rounded-lg border border-green-700 border-opacity-30">
                  <FileText className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Observation: Found 3 relevant docs</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-900 bg-opacity-30 rounded-lg border border-purple-700 border-opacity-30">
                  <Eye className="w-5 h-5 text-purple-400" />
                  <span className="text-sm">Result: Comprehensive answer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">
          Powerful Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition">
            <CardHeader>
              <div className="p-3 bg-blue-900 bg-opacity-30 rounded-lg w-fit mb-4">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <CardTitle>ReAct Agent</CardTitle>
              <CardDescription>
                Reasoning + Acting pattern with LangChain
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-400">
              Watch agents reason through complex queries step-by-step using the ReAct framework.
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition">
            <CardHeader>
              <div className="p-3 bg-purple-900 bg-opacity-30 rounded-lg w-fit mb-4">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
              <CardTitle>Live Visualization</CardTitle>
              <CardDescription>
                Interactive slideshow of agent reasoning
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-400">
              Navigate through each thought, action, and observation in real-time with a beautiful UI.
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition">
            <CardHeader>
              <div className="p-3 bg-green-900 bg-opacity-30 rounded-lg w-fit mb-4">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                Upload and manage your knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-400">
              Add documents to the system and let the agent retrieve and analyze relevant information.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">
          Built with Modern Tech
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Backend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-slate-400">
              <p>• <strong>Python FastAPI</strong> - High-performance async API</p>
              <p>• <strong>LangChain</strong> - Agent framework</p>
              <p>• <strong>Gemini API</strong> - Advanced LLM</p>
              <p>• <strong>WebSocket</strong> - Real-time streaming</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Frontend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-slate-400">
              <p>• <strong>React 19</strong> - Modern UI library</p>
              <p>• <strong>TypeScript</strong> - Type safety</p>
              <p>• <strong>Tailwind CSS</strong> - Beautiful styling</p>
              <p>• <strong>shadcn/ui</strong> - Component library</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-12 text-center border border-slate-700">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Explore AI Reasoning?
          </h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Upload your documents, ask questions, and watch the agent think through complex problems in real-time.
          </p>
          <Link href="/visualizer">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8">
              Open Visualizer
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500">
          <p>© 2024 ReAct RAG Visualizer. Built with ❤️ using LangChain and Gemini API.</p>
        </div>
      </footer>
    </div>
  );
}
