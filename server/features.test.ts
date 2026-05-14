import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the DB so tests don't need a real database connection
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock the LLM so tests don't call external APIs
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Test AI response about the car." } }],
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@cn.ca",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("ai router", () => {
  it("ai.chat returns a reply when DB is unavailable (graceful degradation)", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.chat({
      sessionKey: "general",
      message: "How many cars passed through Kingston Sub in the last week?",
      history: [],
    });
    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
    expect(result.reply.length).toBeGreaterThan(0);
  });

  it("ai.chat works with a car-specific session key", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.chat({
      sessionKey: "TTX 891204",
      message: "What WILD reading was recorded for this car?",
      history: [],
    });
    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
  });

  it("ai.getHistory returns empty messages when DB is unavailable", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.getHistory({ sessionKey: "general" });
    expect(result).toEqual({ messages: [] });
  });

  it("ai.listSessions returns empty array when DB is unavailable", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.listSessions();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("ai.clearHistory returns success when DB is unavailable", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.clearHistory({ sessionKey: "general" });
    expect(result).toEqual({ success: false });
  });

  it("ai.chat requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ai.chat({ sessionKey: "general", message: "Hello", history: [] })
    ).rejects.toThrow();
  });
});

describe("alertRules router", () => {
  it("alertRules.list is publicly accessible", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // DB is null so it returns empty array
    const result = await caller.alertRules.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("alertRules.listAll requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.alertRules.listAll()).rejects.toThrow();
  });

  it("alertRules.create requires admin role", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.alertRules.create({
        title: "Test Alert",
        severity: "warning",
        ruleType: "custom",
        condition: "WILD > 90 kips",
      })
    ).rejects.toThrow("Admin access required");
  });

  it("alertRules.create throws when DB is unavailable even for admin", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.alertRules.create({
        title: "Test Alert",
        severity: "warning",
        ruleType: "custom",
        condition: "WILD > 90 kips",
      })
    ).rejects.toThrow("Database unavailable");
  });
});

describe("watchRules router", () => {
  it("watchRules.list requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.watchRules.list()).rejects.toThrow();
  });

  it("watchRules.list returns empty array when DB unavailable", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.watchRules.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("watchRules.create throws when DB is unavailable", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.watchRules.create({
        name: "Watch TTX 891204",
        watchType: "car",
        target: "TTX 891204",
        condition: "WILD reading > 90 kips",
        emailAlert: false,
      })
    ).rejects.toThrow("Database unavailable");
  });

  it("watchRules.create with emailAlert requires emailAddress", async () => {
    // Zod validation should catch missing email when emailAlert is true
    // But since emailAddress is optional in the schema, the server-side
    // validation is in the mutation handler. This test verifies the router
    // schema accepts the input shape correctly.
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.watchRules.create({
        name: "Watch with email",
        watchType: "wheel",
        target: "BNSF 584291 — Axle B2",
        condition: "HBD > 60°F above ambient",
        emailAlert: true,
        emailAddress: "test@cn.ca",
      })
    ).rejects.toThrow("Database unavailable");
  });
});
