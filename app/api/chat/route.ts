import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { COPILOT_TOOLS, executeTool, buildCopilotContext, buildCopilotSystemPrompt } from "@/lib/copilot";
import { CHAT_CREDIT_COST } from "@/lib/types";
import type { DbUser } from "@/lib/types";
import { sanitizeUiBlocks } from "@/lib/gen-ui";

const COPILOT_MODEL = process.env.COPILOT_MODEL ?? "anthropic/claude-sonnet-4";
const COPILOT_MAX_TOKENS = Number(process.env.COPILOT_MAX_TOKENS) || 1024;

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null | ContentBlock[];
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

interface OpenRouterChoice {
  message: {
    role: string;
    content: string | null;
    tool_calls?: Array<{
      id: string;
      type: "function";
      function: { name: string; arguments: string };
    }>;
  };
  finish_reason: string;
}

async function callOpenRouter(messages: OpenRouterMessage[], systemPrompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: COPILOT_MODEL,
      max_tokens: COPILOT_MAX_TOKENS,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      tools: COPILOT_TOOLS,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 402) {
      throw new Error(
        "The AI service has run out of credits. Please top up your OpenRouter balance or reduce COPILOT_MAX_TOKENS."
      );
    }
    throw new Error(`OpenRouter ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { choices: OpenRouterChoice[] };
  return data.choices[0];
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  // ── Parse body — support both JSON and multipart (image upload) ─────────────
  const contentType = req.headers.get("content-type") ?? "";
  let message: string;
  let session_id: string | undefined;
  let imageBase64: string | null = null;
  let imageMediaType = "image/jpeg";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    message = (formData.get("message") as string | null) ?? "";
    session_id = (formData.get("session_id") as string | null) ?? undefined;
    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const buffer = await imageFile.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString("base64");
      imageMediaType = imageFile.type || "image/jpeg";
    }
  } else {
    const body = await req.json();
    message = body.message;
    session_id = body.session_id;
  }

  if (!message?.trim() && !imageBase64) {
    return new Response(JSON.stringify({ error: "Message or image is required" }), { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // ── Load user ────────────────────────────────────────────────────────────
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  if (user.credits_remaining < CHAT_CREDIT_COST) {
    return new Response(JSON.stringify({ error: "Insufficient credits" }), { status: 402 });
  }

  // ── Session management ───────────────────────────────────────────────────
  let sessionId = session_id;
  if (!sessionId) {
    const { data: session, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: userId, title: message.slice(0, 80) })
      .select("id")
      .single();
    if (error || !session) {
      return new Response(JSON.stringify({ error: "Failed to create session" }), { status: 500 });
    }
    sessionId = session.id;
  }

  // ── Load conversation history ────────────────────────────────────────────
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(50);

  const conversationHistory: OpenRouterMessage[] = (history ?? []).map((m) => ({
    role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
    content: m.content,
  }));

  // ── Persist user message (store text only; images are not stored in DB) ────
  const persistContent = imageBase64
    ? `[Screenshot] ${message}`.trim()
    : message;
  await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role: "user",
    content: persistContent,
  });

  // ── Deduct chat credit ───────────────────────────────────────────────────
  await supabase.rpc("deduct_chat_credit", { p_user_id: userId, p_amount: CHAT_CREDIT_COST });

  // ── Build context ────────────────────────────────────────────────────────
  const context = await buildCopilotContext(userId);
  const systemPrompt = buildCopilotSystemPrompt(user as DbUser, context);

  // ── Build user message content (vision or text) ──────────────────────────
  const userMessageContent: OpenRouterMessage["content"] = imageBase64
    ? [
        { type: "image_url", image_url: { url: `data:${imageMediaType};base64,${imageBase64}` } },
        { type: "text", text: message || "Analyze this conversation screenshot for buying intent signals." },
      ]
    : message;

  // ── Stream response ──────────────────────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const messages: OpenRouterMessage[] = [
          ...conversationHistory,
          { role: "user", content: userMessageContent },
        ];

        let continueLoop = true;
        let fullAssistantText = "";

        while (continueLoop) {
          const choice = await callOpenRouter(messages, systemPrompt);
          const assistantMsg = choice.message;

          // Collect text content
          if (assistantMsg.content) {
            fullAssistantText += assistantMsg.content;
            send({ type: "text", content: assistantMsg.content });
          }

          if (choice.finish_reason === "tool_calls" && assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
            // Send tool calls to client
            for (const tc of assistantMsg.tool_calls) {
              const args = JSON.parse(tc.function.arguments);
              send({ type: "tool_call", name: tc.function.name, args });
            }

            // Add assistant message with tool_calls to conversation
            messages.push({
              role: "assistant",
              content: assistantMsg.content,
              tool_calls: assistantMsg.tool_calls,
            });

            // Execute tools and add results
            for (const tc of assistantMsg.tool_calls) {
              const args = JSON.parse(tc.function.arguments);
              const result = await executeTool(
                tc.function.name,
                args,
                userId,
                user.product_category ?? "B2B SaaS",
                user.business_profile ?? null
              );
              if (tc.function.name === "present_ui") {
                const blocks = sanitizeUiBlocks(
                  result && typeof result === "object" && "blocks" in result
                    ? (result as { blocks: unknown }).blocks
                    : result
                );
                send({ type: "ui", blocks });
              }
              send({ type: "tool_result", name: tc.function.name, result });

              messages.push({
                role: "tool",
                content: JSON.stringify(result),
                tool_call_id: tc.id,
              });
            }
            // Continue loop to get the model's response after tool results
          } else {
            continueLoop = false;
          }
        }

        // ── Persist assistant message ──────────────────────────────────────
        if (fullAssistantText) {
          await supabase.from("chat_messages").insert({
            session_id: sessionId,
            role: "assistant",
            content: fullAssistantText,
          });
        }

        // Update session timestamp
        await supabase
          .from("chat_sessions")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", sessionId);

        send({ type: "done", session_id: sessionId });
        controller.close();
      } catch (err) {
        console.error("[chat] error:", err);
        const msg = err instanceof Error ? err.message : "An error occurred while processing your request.";
        send({ type: "error", message: msg });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
