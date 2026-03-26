"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import type { BusinessProfile } from "@/lib/types";

// ─── Onboarding Steps ───────────────────────────────────────────────────────

interface Step {
  id: keyof BusinessProfile;
  question: string;
  options: string[];
  multiSelect?: boolean;
}

const STEPS: Step[] = [
  {
    id: "product_category",
    question: "What best describes what you sell?",
    options: ["SaaS / Software", "Consulting / Services", "Hardware / Physical", "Marketplace / Platform"],
  },
  {
    id: "target_industries",
    question: "Which industries do you primarily sell into?",
    options: ["Technology", "Financial Services", "Healthcare", "E-commerce / Retail", "Manufacturing", "Education"],
    multiSelect: true,
  },
  {
    id: "company_size",
    question: "What size companies are your ideal customers?",
    options: ["Startups (1-50)", "SMB (51-200)", "Mid-Market (201-1000)", "Enterprise (1000+)"],
  },
  {
    id: "buyer_role",
    question: "Who is your primary buyer?",
    options: ["C-Suite / Founders", "VP / Director", "Manager / Team Lead", "Individual Contributor"],
  },
  {
    id: "sales_motion",
    question: "How does your team primarily sell?",
    options: ["Outbound (cold outreach)", "Inbound (content/SEO/ads)", "Product-Led Growth", "Channel / Partners"],
  },
  {
    id: "deal_size",
    question: "What's your typical deal size?",
    options: ["< $5K", "$5K - $25K", "$25K - $100K", "$100K+"],
  },
  {
    id: "sales_cycle",
    question: "How long is your typical sales cycle?",
    options: ["< 2 weeks", "2-4 weeks", "1-3 months", "3+ months"],
  },
];

// ─── Message Types ──────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  options?: string[];
  multiSelect?: boolean;
  stepId?: string;
  isTyping?: boolean;
}

// ─── Components ─────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-cyan-400"
          style={{
            animation: "thinking-dot 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function OptionButton({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        text-left px-4 py-2.5 text-sm border transition-all duration-200 cursor-pointer
        ${selected
          ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300"
          : "bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-cyan-500/30 hover:bg-cyan-500/5"
        }
        ${disabled ? "opacity-50 pointer-events-none" : ""}
        rounded-lg
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <span>{label}</span>
        {selected && <Check className="w-4 h-4 text-cyan-500 shrink-0" />}
      </div>
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [multiSelections, setMultiSelections] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  // Show initial greeting + first question
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const greet = async () => {
      setIsTyping(true);
      await delay(800);

      setMessages([{
        id: "greeting",
        role: "assistant",
        content: "Welcome to IntentIQ! I'm going to ask you a few questions about your business so I can personalize your intent scoring.",
      }]);
      setIsTyping(false);
      scrollToBottom();

      await delay(1200);
      showStep(0);
    };
    greet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function showStep(stepIndex: number) {
    if (stepIndex >= STEPS.length) {
      await completeOnboarding();
      return;
    }

    const step = STEPS[stepIndex];
    setIsTyping(true);
    setOptionsVisible(false);
    scrollToBottom();

    await delay(900);

    setMessages((prev) => [
      ...prev,
      {
        id: `q-${step.id}`,
        role: "assistant",
        content: step.question,
        options: step.options,
        multiSelect: step.multiSelect,
        stepId: step.id,
      },
    ]);
    setIsTyping(false);
    scrollToBottom();

    await delay(300);
    setOptionsVisible(true);
    scrollToBottom();
  }

  function handleSingleSelect(stepId: string, option: string) {
    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: `a-${stepId}`, role: "user", content: option },
    ]);
    setAnswers((prev) => ({ ...prev, [stepId]: option }));
    setOptionsVisible(false);

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    setTimeout(() => {
      showStep(nextStep);
    }, 400);
  }

  function handleMultiToggle(option: string) {
    setMultiSelections((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }

  function handleMultiConfirm(stepId: string) {
    if (multiSelections.length === 0) return;

    setMessages((prev) => [
      ...prev,
      { id: `a-${stepId}`, role: "user", content: multiSelections.join(", ") },
    ]);
    setAnswers((prev) => ({ ...prev, [stepId]: [...multiSelections] }));
    setMultiSelections([]);
    setOptionsVisible(false);

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    setTimeout(() => {
      showStep(nextStep);
    }, 400);
  }

  async function completeOnboarding() {
    setIsTyping(true);
    scrollToBottom();
    await delay(1000);

    setMessages((prev) => [
      ...prev,
      {
        id: "complete",
        role: "assistant",
        content: "You're all set! I've got a clear picture of your business. Let me personalize your scoring experience...",
      },
    ]);
    setIsTyping(false);
    setIsComplete(true);
    scrollToBottom();

    // Build profile and save
    const profile: BusinessProfile = {
      product_category: answers.product_category as string ?? "",
      target_industries: (answers.target_industries as string[]) ?? [],
      company_size: answers.company_size as string ?? "",
      buyer_role: answers.buyer_role as string ?? "",
      sales_motion: answers.sales_motion as string ?? "",
      deal_size: answers.deal_size as string ?? "",
      sales_cycle: answers.sales_cycle as string ?? "",
    };

    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_profile: profile }),
      });
    } catch (err) {
      console.error("[onboarding] Failed to save profile:", err);
    }

    await delay(2000);
    // Hard navigation to force server re-render (re-fetches onboarding_completed)
    window.location.href = "/dashboard";
  }

  // Find the last assistant message that has options and is the current step
  const activeStepMsg = messages.find(
    (m) => m.role === "assistant" && m.options && m.stepId === STEPS[currentStep]?.id
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-white/[0.06] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-cyan-600 dark:text-cyan-400 text-xs tracking-[0.2em] font-bold">[ INTENT IQ ]</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">
              {currentStep < STEPS.length ? `Step ${currentStep + 1} of ${STEPS.length}` : "Complete"}
            </span>
            <div className="w-24 h-1 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + (isComplete ? 1 : 0)) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin"
      >
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
            >
              {msg.role === "assistant" ? (
                <div className="max-w-[85%]">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg px-4 py-3">
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{msg.content}</p>
                    </div>
                  </div>

                  {/* Options — only show for the current active step */}
                  {msg.options && msg.stepId === STEPS[currentStep]?.id && optionsVisible && (
                    <div className="ml-10 mt-3 space-y-2 animate-slide-up">
                      <div className="grid gap-2">
                        {msg.options.map((opt) => (
                          <OptionButton
                            key={opt}
                            label={opt}
                            selected={
                              msg.multiSelect
                                ? multiSelections.includes(opt)
                                : false
                            }
                            onClick={() =>
                              msg.multiSelect
                                ? handleMultiToggle(opt)
                                : handleSingleSelect(msg.stepId!, opt)
                            }
                            disabled={isComplete}
                          />
                        ))}
                      </div>
                      {msg.multiSelect && (
                        <button
                          onClick={() => handleMultiConfirm(msg.stepId!)}
                          disabled={multiSelections.length === 0}
                          className={`
                            flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer
                            ${multiSelections.length > 0
                              ? "bg-cyan-500 text-white hover:bg-cyan-400"
                              : "bg-slate-100 dark:bg-white/[0.05] text-slate-400 pointer-events-none"
                            }
                          `}
                        >
                          Continue
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-[75%] bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-4 py-2.5">
                  <p className="text-sm text-cyan-800 dark:text-cyan-100">{msg.content}</p>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg">
                  <TypingIndicator />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
