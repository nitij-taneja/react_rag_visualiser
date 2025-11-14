import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";

/**
 * ReAct RAG Agent System
 * Implements Reasoning + Acting pattern with document retrieval
 */

export interface AgentStep {
  type: "thought" | "action" | "observation" | "result";
  content: string;
  timestamp: number;
}

export interface AgentState {
  steps: AgentStep[];
  currentQuery: string;
  documents: string[];
  isProcessing: boolean;
}

export class ReactRagAgent {
  private model: ChatGoogleGenerativeAI;
  private documents: Map<string, string>;
  private state: AgentState;
  private maxIterations: number = 5;

  constructor(apiKey: string, documents: Map<string, string> = new Map()) {
    this.model = new ChatGoogleGenerativeAI({
      apiKey,
      model: "gemini-pro",
      temperature: 0.7,
    });

    this.documents = documents;

    this.state = {
      steps: [],
      currentQuery: "",
      documents: [],
      isProcessing: false,
    };
  }

  private addStep(type: AgentStep["type"], content: string): void {
    this.state.steps.push({
      type,
      content,
      timestamp: Date.now(),
    });
  }

  private retrieveDocuments(query: string): string {
    // Simple keyword-based retrieval
    const queryLower = query.toLowerCase();
    const results: string[] = [];

    for (const [title, content] of this.documents) {
      if (
        title.toLowerCase().includes(queryLower) ||
        content.toLowerCase().includes(queryLower)
      ) {
        results.push(`[${title}]\n${content.substring(0, 500)}...`);
      }
    }

    return results.length > 0
      ? results.join("\n\n---\n\n")
      : "No relevant documents found.";
  }

  private analyzeText(text: string, query: string): string {
    // Extract key sentences related to the query
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
    const queryWords = query.split(" ");
    const relevant = sentences.filter((s) =>
      queryWords.some((word) => s.toLowerCase().includes(word.toLowerCase()))
    );

    return relevant.length > 0
      ? `Key findings:\n${relevant.slice(0, 3).join("\n")}`
      : "No specific findings related to the query.";
  }

  async processQuery(query: string): Promise<{
    result: string;
    steps: AgentStep[];
  }> {
    this.state = {
      steps: [],
      currentQuery: query,
      documents: [],
      isProcessing: true,
    };

    this.addStep("thought", `Analyzing query: "${query}"`);

    const systemPrompt = `You are a helpful ReAct agent that reasons step-by-step and uses tools to retrieve and analyze documents.

Available tools:
- retrieve_documents: Search for relevant documents based on keywords
- analyze_text: Extract key information from retrieved documents

Follow this pattern:
1. Thought: Analyze what you need to do
2. Action: Decide to retrieve documents or analyze text
3. Observation: Process the results
4. Repeat until you have enough information
5. Final Answer: Provide a comprehensive response

Be concise and clear in your reasoning. After gathering information, provide a final answer.`;

    const messages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(query),
    ];

    let iterations = 0;
    let finalAnswer = "";

    while (iterations < this.maxIterations) {
      iterations++;

      try {
        // Get model response
        const response = await this.model.invoke(messages);
        const content = response.content as string;

        this.addStep("thought", content);

        // Check if we have a final answer
        if (
          content.toLowerCase().includes("final answer") ||
          content.toLowerCase().includes("answer:") ||
          iterations >= this.maxIterations
        ) {
          finalAnswer = content;
          this.addStep("result", finalAnswer);
          break;
        }

        // Parse and execute tool calls if present
        let toolExecuted = false;

        if (
          content.toLowerCase().includes("retrieve") ||
          content.toLowerCase().includes("search")
        ) {
          // Extract search query from response
          const match = content.match(/(?:retrieve|search|find).*?(?:for|about|on)?\s*["\']?([^"\'.\n]+)/i);
          const searchQuery = match ? match[1] : query;

          this.addStep("action", `Retrieving documents for: "${searchQuery}"`);

          const result = this.retrieveDocuments(searchQuery);
          this.addStep("observation", result);

          messages.push(new HumanMessage(content));
          messages.push(
            new HumanMessage(
              `Tool result from document retrieval:\n${result}\n\nContinue your analysis.`
            )
          );

          toolExecuted = true;
        } else if (
          content.toLowerCase().includes("analyze") ||
          content.toLowerCase().includes("extract")
        ) {
          this.addStep("action", "Analyzing retrieved documents");
          const result = this.analyzeText(content, query);
          this.addStep("observation", result);

          messages.push(new HumanMessage(content));
          messages.push(
            new HumanMessage(
              `Tool result from analysis:\n${result}\n\nProvide your final answer based on this analysis.`
            )
          );

          toolExecuted = true;
        }

        if (!toolExecuted) {
          // No tool call, treat as final answer
          finalAnswer = content;
          this.addStep("result", finalAnswer);
          break;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        this.addStep("thought", `Error during processing: ${errorMsg}`);
        break;
      }
    }

    this.state.isProcessing = false;

    return {
      result:
        finalAnswer ||
        "Unable to generate a complete answer. Please try again.",
      steps: this.state.steps,
    };
  }

  updateDocuments(documents: Map<string, string>): void {
    this.documents = documents;
  }

  getState(): AgentState {
    return this.state;
  }
}
