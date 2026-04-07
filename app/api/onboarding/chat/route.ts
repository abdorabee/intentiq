import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  ONBOARDING_TOOLS,
  ONBOARDING_SYSTEM_PROMPT,
  parseBusinessProfile,
} from "@/lib/onboarding-prompt";

const COPILOT_MODEL = process.env.COPILOT_MODEL ?? "anthropic/claude-sonnet-4";
const COPILOT_MAX_TOKENS = Number(process.env.COPILOT_MAX_TOKENS) || 1024;

interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
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

async function callOpenRouter(messages: OpenRouterMessage[]) {
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
      temperature: 0.5,
      messages: [
        { role: "system", content: ONBOARDING_SYSTEM_PROMPT },
        ...messages,
      ],
      tools: ONBOARDING_TOOLS,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { choices: OpenRouterChoice[] };
  return data.choices[0];
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await req.json();
  const { messages: clientMessages } = body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  // Convert client messages to OpenRouter format
  const conversationHistory: OpenRouterMessage[] = (clientMessages ?? []).map(
    (m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const messages: OpenRouterMessage[] = [...conversationHistory];
        let continueLoop = true;

        while (continueLoop) {
          const choice = await callOpenRouter(messages);
          const assistantMsg = choice.message;

          // Send any text content
          if (assistantMsg.content) {
            send({ type: "text", content: assistantMsg.content });
          }

          if (
            choice.finish_reason === "tool_calls" &&
            assistantMsg.tool_calls?.length
          ) {
            // Add assistant message to conversation for the agentic loop
            messages.push({
              role: "assistant",
              content: assistantMsg.content,
              tool_calls: assistantMsg.tool_calls,
            });

            for (const tc of assistantMsg.tool_calls) {
              const args = JSON.parse(tc.function.arguments);

              if (tc.function.name === "present_choices") {
                // Send choices to client — don't continue the loop
                send({
                  type: "choices",
                  message: args.message as string,
                  options: args.options as string[],
                  multi_select: args.multi_select ?? false,
                });
                // Add a synthetic tool result so context stays valid
                messages.push({
                  role: "tool",
                  content: JSON.stringify({ displayed: true }),
                  tool_call_id: tc.id,
                });
                continueLoop = false;
              } else if (tc.function.name === "save_business_profile") {
                const profile = parseBusinessProfile(args);
                if (!profile) {
                  send({
                    type: "error",
                    message: "Invalid profile data from AI. Please try again.",
                  });
                  continueLoop = false;
                  break;
                }

                // Save profile via Supabase directly
                const supabase = createSupabaseAdmin();
                const { error } = await supabase
                  .from("users")
                  .update({
                    business_profile: profile,
                    product_category: profile.product_category,
                    onboarding_completed: true,
                  })
                  .eq("id", userId);

                if (error) {
                  send({
                    type: "error",
                    message: "Failed to save your profile. Please try again.",
                  });
                  continueLoop = false;
                  break;
                }

                // Feed result back to model so it can give a final message
                messages.push({
                  role: "tool",
                  content: JSON.stringify({ saved: true }),
                  tool_call_id: tc.id,
                });
                // Let the loop continue so the model can respond after saving
              }
            }
          } else {
            // No tool calls — model is done talking
            continueLoop = false;
          }
        }

        send({ type: "done" });
        controller.close();
      } catch (err) {
        console.error("[onboarding-chat] error:", err);
        const msg =
          err instanceof Error
            ? err.message
            : "An error occurred. Please try again.";
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
