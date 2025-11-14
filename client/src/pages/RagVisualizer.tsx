import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, Upload, FileText, Zap, Brain, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { documentsApi, queriesApi, apiService } from "@/lib/api";
import { useBackendStatus } from "@/hooks/useBackendStatus";

interface AgentStep {
  type: "thought" | "action" | "observation" | "result";
  content: string;
  timestamp: number;
}

interface Document {
  title: string;
  content_preview: string;
  size: number;
}

export default function RagVisualizer() {
  const { user } = useAuth();
  const backendStatus = useBackendStatus();
  
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await documentsApi.getAll();
        console.log("Initial documents fetch:", response);

        if (response.success) {
          // Backend returns documents in 'documents' field, not 'data'
          const docs = (response as any).documents || response.data || [];
          console.log("Loaded documents:", docs);
          setDocuments(docs);
        } else if (!response.success) {
          setError(response.error || "Failed to load documents");
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
        setError("Failed to connect to backend. Make sure the Python backend is running.");
      }
    };

    // Only fetch if backend is healthy
    if (backendStatus.isHealthy) {
      fetchDocuments();
    }
  }, [backendStatus.isHealthy]);

  // Auto-advance slides
  useEffect(() => {
    if (!loading && steps.length > 0 && currentStepIndex < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, steps, currentStepIndex]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename
      if (!documentTitle) {
        setDocumentTitle(file.name);
      }
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    setUploadingDoc(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${apiService.baseUrl}/api/documents/upload-file`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Refresh documents list
        const docsResponse = await documentsApi.getAll();
        console.log("Documents response:", docsResponse);

        if (docsResponse.success) {
          // Backend returns documents in 'documents' field, not 'data'
          const docs = (docsResponse as any).documents || docsResponse.data || [];
          console.log("Setting documents:", docs);
          setDocuments(docs);
        }
        setSelectedFile(null);
        setDocumentTitle("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setError(null);
      } else {
        setError(data.error || "Failed to upload file");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Error uploading file. Backend may not be running.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!documentTitle.trim() || !documentContent.trim()) {
      setError("Please fill in both title and content");
      return;
    }

    setUploadingDoc(true);
    setError(null);

    try {
      const response = await documentsApi.upload({
        title: documentTitle,
        content: documentContent,
        mime_type: "text/plain",
      });

      if (response.success) {
        // Refresh documents list from backend
        const docsResponse = await documentsApi.getAll();
        if (docsResponse.success) {
          const docs = (docsResponse as any).documents || docsResponse.data || [];
          setDocuments(docs);
        }
        setDocumentTitle("");
        setDocumentContent("");
        setError(null);
      } else {
        setError(response.error || "Failed to upload document");
      }
    } catch (err) {
      console.error("Error uploading document:", err);
      setError("Error uploading document. Backend may not be running.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleProcessQuery = async () => {
    if (!query.trim()) {
      setError("Please enter a query");
      return;
    }

    if (!backendStatus.isHealthy) {
      setError("Backend is not available. Please start the Python backend with: python run.py");
      return;
    }

    setLoading(true);
    setSteps([]);
    setResult("");
    setCurrentStepIndex(0);
    setError(null);

    try {
      const response = await queriesApi.process(query);

      console.log("Query response:", response);

      if (response.success) {
        // The backend returns data directly in the response, not nested under 'data'
        const steps = response.data?.steps || (response as any).steps || [];
        const result = response.data?.result || (response as any).result || "";

        console.log("Steps:", steps);
        console.log("Result:", result);

        setSteps(steps);
        setResult(result);
        setCurrentStepIndex(0);
      } else {
        setError(response.error || "Failed to process query");
      }
    } catch (err) {
      console.error("Error processing query:", err);
      setError("Error processing query. Please check that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = steps[currentStepIndex];

  const getStepIcon = (type: string) => {
    switch (type) {
      case "thought":
        return <Brain className="w-6 h-6" />;
      case "action":
        return <Zap className="w-6 h-6" />;
      case "observation":
        return <FileText className="w-6 h-6" />;
      case "result":
        return <Send className="w-6 h-6" />;
      default:
        return <Brain className="w-6 h-6" />;
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case "thought":
        return "from-blue-500 to-blue-600";
      case "action":
        return "from-yellow-500 to-yellow-600";
      case "observation":
        return "from-green-500 to-green-600";
      case "result":
        return "from-purple-500 to-purple-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ReAct RAG Visualizer
          </h1>
          <p className="text-slate-400">
            Watch AI agents reason through complex queries in real-time
          </p>
        </div>

        {/* Backend Status Alert */}
        {!backendStatus.isHealthy && !backendStatus.isChecking && (
          <Alert className="mb-6 bg-red-900 border-red-700">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              <strong>Backend Not Available:</strong> The Python backend is not running. 
              Please start it with: <code className="bg-red-800 px-2 py-1 rounded">python run.py</code> in the python_backend directory.
            </AlertDescription>
          </Alert>
        )}

        {/* Backend Status Indicator */}
        {!backendStatus.isChecking && (
          <div className="mb-6 flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${backendStatus.isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-slate-400">
              Backend: <span className={backendStatus.isHealthy ? 'text-green-400' : 'text-red-400'}>
                {backendStatus.isHealthy ? 'Connected' : 'Disconnected'}
              </span>
            </span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 bg-red-900 border-red-700">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Documents & Query */}
          <div className="lg:col-span-1 space-y-6">
            {/* Document Upload */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Documents
                </CardTitle>
                <CardDescription>Add documents to the knowledge base</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Option */}
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.doc,.docx,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-slate-400" />
                      <p className="text-sm text-slate-400">
                        {selectedFile ? selectedFile.name : "Click to upload a file"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Supports .txt, .md, .doc, .docx, .pdf
                      </p>
                    </div>
                  </label>
                </div>

                {selectedFile && (
                  <Button
                    onClick={handleUploadFile}
                    disabled={uploadingDoc || !backendStatus.isHealthy}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    {uploadingDoc ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading File...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload File
                      </>
                    )}
                  </Button>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-800 px-2 text-slate-400">Or paste content</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Document Title</label>
                  <Input
                    placeholder="e.g., Python Basics"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                    disabled={!backendStatus.isHealthy}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <Textarea
                    placeholder="Paste document content here..."
                    value={documentContent}
                    onChange={(e) => setDocumentContent(e.target.value)}
                    className="bg-slate-700 border-slate-600 h-32 resize-none"
                    disabled={!backendStatus.isHealthy}
                  />
                </div>
                <Button
                  onClick={handleUploadDocument}
                  disabled={uploadingDoc || !backendStatus.isHealthy}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {uploadingDoc ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Text
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Documents List */}
            {documents.length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">Knowledge Base</CardTitle>
                  <CardDescription>{documents.length} documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                  {documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition"
                    >
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {doc.size} bytes
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Query Input */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Ask a Question
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Ask anything about your documents..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-slate-700 border-slate-600 h-24 resize-none"
                  disabled={!backendStatus.isHealthy}
                />
                <Button
                  onClick={handleProcessQuery}
                  disabled={loading || !backendStatus.isHealthy}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Process Query
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Visualization */}
          <div className="lg:col-span-2">
            {steps.length > 0 ? (
              <Card className="bg-slate-800 border-slate-700 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Agent Reasoning Process</span>
                    <span className="text-sm font-normal text-slate-400">
                      Step {currentStepIndex + 1} of {steps.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Slideshow */}
                  {currentStep && (
                    <div
                      className={`bg-gradient-to-br ${getStepColor(
                        currentStep.type
                      )} p-8 rounded-lg text-white shadow-lg min-h-48 flex flex-col justify-center`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        {getStepIcon(currentStep.type)}
                        <h3 className="text-2xl font-bold capitalize">
                          {currentStep.type}
                        </h3>
                      </div>
                      <p className="text-lg leading-relaxed">
                        {currentStep.content}
                      </p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex gap-4">
                    <Button
                      onClick={() =>
                        setCurrentStepIndex(Math.max(0, currentStepIndex - 1))
                      }
                      disabled={currentStepIndex === 0}
                      variant="outline"
                      className="flex-1"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() =>
                        setCurrentStepIndex(
                          Math.min(steps.length - 1, currentStepIndex + 1)
                        )
                      }
                      disabled={currentStepIndex === steps.length - 1}
                      variant="outline"
                      className="flex-1"
                    >
                      Next
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          ((currentStepIndex + 1) / steps.length) * 100
                        }%`,
                      }}
                    />
                  </div>

                  {/* Steps Timeline */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-300">
                      Steps
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {steps.map((step, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentStepIndex(idx)}
                          className={`p-2 rounded text-xs font-medium transition ${
                            idx === currentStepIndex
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          {step.type.charAt(0).toUpperCase() +
                            step.type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Final Result */}
                  {result && (
                    <Card className="bg-slate-700 border-slate-600">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          Final Answer
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-200 leading-relaxed">
                          {result}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800 border-slate-700 h-full flex items-center justify-center min-h-96">
                <CardContent className="text-center">
                  <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    {backendStatus.isHealthy
                      ? "Upload documents and ask a question to see the agent's reasoning process"
                      : "Waiting for backend connection..."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
