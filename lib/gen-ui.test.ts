import { describe, expect, it } from "vitest";

import {
  blocksFromToolResult,
  presentUiAllowedTypes,
  sanitizeUiBlocks,
  UI_BLOCK_REGISTRY,
  UI_BLOCK_TYPES,
  workspaceFromScore,
} from "./gen-ui";
import type { SignalResult, SignalSet } from "./types";

function signal(score: number, max = 25): SignalResult {
  return {
    score,
    max,
    detail: "detail",
    status: "ok",
    observed_at: "2026-08-01T00:00:00.000Z",
    fetched_at: "2026-08-01T00:00:00.000Z",
    source: "test",
  };
}

function signals(): SignalSet {
  return {
    funding: signal(20),
    hiring: signal(0, 20),
    news: signal(4, 20),
    technology: signal(8, 20),
    web: signal(40, 100),
    github: signal(10, 100),
    latestSignalDate: "2026-08-01T00:00:00.000Z",
  };
}

describe("sanitizeUiBlocks", () => {
  it("drops unknown types and keeps valid blocks", () => {
    const blocks = sanitizeUiBlocks([
      { type: "nope" },
      { type: "markdown", text: "Keep this" },
      { type: "intent_hero", company: "Acme", domain: "acme.com", intent_score: 12, score_band: "COLD" },
    ]);
    expect(blocks.map((b) => b.type)).toEqual(["markdown", "intent_hero"]);
  });

  it("filters domain-bearing blocks against scored accounts", () => {
    const blocks = sanitizeUiBlocks(
      [
        { type: "intent_hero", company: "Acme", domain: "acme.com", intent_score: 12, score_band: "COLD" },
        { type: "intent_hero", company: "Evil", domain: "evil.com", intent_score: 90, score_band: "HOT" },
        { type: "markdown", text: "ok" },
      ],
      ["acme.com"],
    );
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: "intent_hero", domain: "acme.com" });
    expect(blocks[1]).toMatchObject({ type: "markdown" });
  });

  it("accepts { blocks } envelopes", () => {
    const blocks = sanitizeUiBlocks({
      blocks: [{ type: "markdown", text: "hi" }],
    });
    expect(blocks).toHaveLength(1);
  });

  it("preserves model-supplied action_rail prompts", () => {
    const blocks = sanitizeUiBlocks([
      {
        type: "action_rail",
        company: "Acme",
        domain: "acme.com",
        suggestions: [
          { label: "Draft outreach", prompt: "Draft a personalized outreach email for Acme" },
        ],
      },
    ]);
    expect(blocks[0]).toMatchObject({
      type: "action_rail",
      suggestions: [{
        label: "Draft outreach",
        prompt: "Draft a personalized outreach email for Acme",
      }],
    });
  });
});

describe("new block schemas", () => {
  it("accepts result_list, pipeline_summary, person_card, and confirmation", () => {
    const blocks = sanitizeUiBlocks([
      {
        type: "result_list",
        query: "acme",
        items: [{ company: "Acme", domain: "acme.com", intent_score: 12, score_band: "COLD" }],
      },
      {
        type: "pipeline_summary",
        total: 1,
        stages: [{ stage: "hot", count: 1, companies: [{ company: "Acme", domain: "acme.com", score: 80 }] }],
      },
      {
        type: "person_card",
        name: "Ada Lovelace",
        title: "CTO",
        company: "Acme",
        intent_score: 71,
        score_band: "WARM",
        summary: "Exploring vendors.",
      },
      {
        type: "confirmation",
        action: "add_to_watchlist",
        title: "Add to watchlist",
        description: "Add Acme?",
        domain: "acme.com",
        company: "Acme",
      },
    ]);
    expect(blocks.map((b) => b.type)).toEqual([
      "result_list",
      "pipeline_summary",
      "person_card",
      "confirmation",
    ]);
  });

  it("drops incomplete new-block payloads", () => {
    const blocks = sanitizeUiBlocks([
      { type: "result_list" },
      { type: "pipeline_summary", total: 1 },
      { type: "person_card", name: "Ada" },
      { type: "confirmation", action: "delete_everything", domain: "acme.com", title: "x", description: "x" },
    ]);
    expect(blocks).toEqual([]);
  });
});

describe("blocksFromToolResult", () => {
  it("maps search_scored_companies to result_list", () => {
    const blocks = blocksFromToolResult("search_scored_companies", {
      results: [
        { domain: "acme.com", company_name: "Acme", score: 12, score_band: "COLD" },
        { domain: "bad" },
      ],
    });
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: "result_list",
      items: [{ company: "Acme", domain: "acme.com", intent_score: 12, score_band: "COLD" }],
    });
  });

  it("maps get_pipeline_summary to pipeline_summary", () => {
    const blocks = blocksFromToolResult("get_pipeline_summary", {
      total: 2,
      counts: { hot: 1, cold: 1 },
      top_per_stage: {
        hot: [{ domain: "acme.com", company_name: "Acme", score: 88 }],
        cold: [{ domain: "beta.co", company_name: "Beta", score: 20 }],
      },
    });
    expect(blocks[0]).toMatchObject({
      type: "pipeline_summary",
      total: 2,
    });
    if (blocks[0]?.type === "pipeline_summary") {
      expect(blocks[0].stages.map((s) => s.stage)).toEqual(["hot", "cold"]);
    }
  });

  it("maps score_person to person_card", () => {
    const blocks = blocksFromToolResult("score_person", {
      person_name: "Ada Lovelace",
      person_title: "CTO",
      person_company: "Acme",
      intent_score: 71,
      score_band: "WARM",
      ai_summary: "Exploring vendors.",
    });
    expect(blocks[0]).toMatchObject({
      type: "person_card",
      name: "Ada Lovelace",
      intent_score: 71,
      score_band: "WARM",
    });
  });

  it("maps watchlist and pipeline mutations to confirmation", () => {
    const watch = blocksFromToolResult("add_to_watchlist", {
      needs_confirmation: true,
      action: "add_to_watchlist",
      domain: "acme.com",
      company_name: "Acme",
      message: "Confirm to add Acme (acme.com) to your watchlist.",
    });
    const stage = blocksFromToolResult("update_pipeline_stage", {
      needs_confirmation: true,
      action: "update_pipeline_stage",
      domain: "acme.com",
      stage: "engaged",
      message: "Confirm moving acme.com to engaged.",
    });
    expect(watch[0]).toMatchObject({
      type: "confirmation",
      action: "add_to_watchlist",
      domain: "acme.com",
      status: "pending",
    });
    expect(stage[0]).toMatchObject({
      type: "confirmation",
      action: "update_pipeline_stage",
      stage: "engaged",
    });
  });

  it("maps score_company through the existing workspace", () => {
    const blocks = blocksFromToolResult("score_company", {
      company: "Acme",
      domain: "acme.com",
      intent_score: 12,
      score_band: "COLD",
      ai_summary: "Quiet.",
    });
    expect(blocks.map((b) => b.type)).toEqual(["intent_hero", "thesis", "action_rail"]);
  });

  it("returns nothing for unknown tools or error payloads", () => {
    expect(blocksFromToolResult("not_a_tool", { ok: true })).toEqual([]);
    expect(blocksFromToolResult("score_person", { error: "missing input" })).toEqual([]);
  });
});

describe("registry", () => {
  it("exposes every schema type for present_ui", () => {
    const types = presentUiAllowedTypes();
    expect(types).toEqual(UI_BLOCK_TYPES);
    expect(types).toEqual(expect.arrayContaining([
      "result_list",
      "pipeline_summary",
      "person_card",
      "confirmation",
    ]));
    for (const type of types) {
      expect(UI_BLOCK_REGISTRY[type].type).toBe(type);
      expect(UI_BLOCK_REGISTRY[type].schema).toBeTruthy();
    }
  });
});

describe("workspaceFromScore", () => {
  it("builds a default interactive workspace", () => {
    const blocks = workspaceFromScore({
      company: "Acme",
      domain: "acme.com",
      intent_score: 12,
      score_band: "COLD",
      ai_summary: "No current trigger.",
      urgency: "nurture",
      email_subject: "Quick note",
      talk_track: "Hi",
      signals: signals(),
    });
    expect(blocks.map((b) => b.type)).toEqual([
      "intent_hero",
      "signal_explorer",
      "thesis",
      "outreach_studio",
      "action_rail",
    ]);
  });
});
