import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { ReactRagAgent } from "./rag-agent";
import {
  saveDocument,
  getUserDocuments,
  saveRagQuery,
  getUserRagQueries,
  getRagQueryById,
} from "./db";

// Initialize RAG agent with Gemini API
const geminiApiKey = process.env.GEMINI_API_KEY || "";
let ragAgent: ReactRagAgent | null = null;

function getRagAgent(): ReactRagAgent {
  if (!ragAgent) {
    ragAgent = new ReactRagAgent(geminiApiKey);
  }
  return ragAgent;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // RAG system routers
  rag: router({
    // Upload and process documents
    uploadDocument: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          content: z.string(),
          mimeType: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await saveDocument({
          userId: ctx.user.id,
          title: input.title,
          content: input.content,
          mimeType: input.mimeType,
          status: "completed",
        });

        // Update agent with new documents
        const documents = await getUserDocuments(ctx.user.id);
        const docMap = new Map(
          documents.map((d) => [d.title, d.content])
        );
        getRagAgent().updateDocuments(docMap);

        return { success: true };
      }),

    // Get user's documents
    getDocuments: protectedProcedure.query(async ({ ctx }) => {
      return await getUserDocuments(ctx.user.id);
    }),

    // Process query with ReAct agent
    processQuery: protectedProcedure
      .input(z.object({ query: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await saveRagQuery({
          userId: ctx.user.id,
          query: input.query,
          status: "processing",
        });

        try {
          // Get agent and process query
          const agent = getRagAgent();
          const { result, steps } = await agent.processQuery(input.query);

          return {
            success: true,
            result,
            steps,
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";

          return {
            success: false,
            error: errorMsg,
          };
        }
      }),

    // Get query history
    getQueries: protectedProcedure.query(async ({ ctx }) => {
      return await getUserRagQueries(ctx.user.id);
    }),

    // Get specific query details
    getQuery: protectedProcedure
      .input(z.object({ queryId: z.number() }))
      .query(async ({ input }) => {
        return await getRagQueryById(input.queryId);
      }),

    // Stream agent steps (for real-time UI updates)
    streamQuery: protectedProcedure
      .input(z.object({ query: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await saveRagQuery({
          userId: ctx.user.id,
          query: input.query,
          status: "processing",
        });

        const agent = getRagAgent();
        const { result, steps } = await agent.processQuery(input.query);

        return {
          steps,
          result,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
