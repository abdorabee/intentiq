import { afterEach, describe, expect, it, vi } from "vitest";

import {
  extractDomain,
  isAbortError,
  parseSseBlock,
  streamChat,
} from "./chat-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

function sseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

describe("extractDomain", () => {
  it("accepts a bare hostname", () => {
    expect(extractDomain("stripe.com")).toBe("stripe.com");
  });

  it("strips protocol and www", () => {
    expect(extractDomain("https://www.Linear.app/careers")).toBe("linear.app");
  });

  it("rejects questions and empty input", () => {
    expect(extractDomain("why is this cold?")).toBeNull();
    expect(extractDomain("")).toBeNull();
    expect(extractDomain("localhost")).toBeNull();
  });
});

describe("parseSseBlock", () => {
  it("reads a data line and drops malformed payloads", () => {
    expect(parseSseBlock("data: {\"type\":\"text\",\"content\":\"Hi\"}")).toEqual({
      type: "text",
      content: "Hi",
    });
    expect(parseSseBlock("event: ping")).toBeNull();
    expect(parseSseBlock("data: {not-json")).toBeNull();
  });
});

describe("streamChat", () => {
  it("dispatches tool-phase events and returns the session id", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sseResponse([
      "data: {\"type\":\"tool_call\",\"name\":\"search_scored_companies\",\"args\":{\"query\":\"acme\"}}\n\n",
      "data: {\"type\":\"ui\",\"blocks\":[{\"type\":\"result_list\",\"items\":[]}]}\n\n",
      "data: {\"type\":\"tool_result\",\"name\":\"search_scored_companies\",\"result\":{\"results\":[]}}\n\n",
      "data: {\"type\":\"text\",\"content\":\"Here are the matches.\"}\n\n",
      "data: {\"type\":\"done\",\"session_id\":\"sess-1\"}\n\n",
    ])));

    const events: string[] = [];
    const sessionId = await streamChat({ message: "find acme" }, (event) => {
      events.push(event.type);
    });

    expect(sessionId).toBe("sess-1");
    expect(events).toEqual(["tool_call", "ui", "tool_result", "text", "done"]);
  });

  it("sends multipart when an image is attached", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([
      "data: {\"type\":\"done\",\"session_id\":\"sess-2\"}\n\n",
    ]));
    vi.stubGlobal("fetch", fetchMock);

    const image = new File(["png"], "shot.png", { type: "image/png" });
    await streamChat({ message: "read this", session_id: "sess-2", image }, () => undefined);

    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    expect(form.get("message")).toBe("read this");
    expect(form.get("session_id")).toBe("sess-2");
    expect((form.get("image") as File).name).toBe("shot.png");
  });

  it("aborts when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal("fetch", vi.fn(((_url: RequestInfo | URL, init?: RequestInit) => {
      if (init?.signal?.aborted) {
        return Promise.reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
      }
      return Promise.resolve(sseResponse([]));
    }) as typeof fetch));

    await expect(streamChat(
      { message: "stop me" },
      () => undefined,
      { signal: controller.signal },
    )).rejects.toMatchObject({ name: "AbortError" });
    expect(isAbortError(Object.assign(new Error("Aborted"), { name: "AbortError" }))).toBe(true);
  });

  it("skips unparseable SSE chunks instead of crashing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sseResponse([
      "data: {not-json\n\n",
      "data: {\"type\":\"text\",\"content\":\"ok\"}\n\n",
      "data: {\"type\":\"done\",\"session_id\":\"sess-3\"}\n\n",
    ])));
    const events: string[] = [];
    await streamChat({ message: "hello" }, (event) => {
      events.push(event.type);
    });
    expect(events).toEqual(["text", "done"]);
  });
});
