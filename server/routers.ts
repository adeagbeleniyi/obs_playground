import { COOKIE_NAME } from "@shared/const";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { alertRules, chatHistory, watchRules } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

// ─── Operational Intelligence System Prompt ──────────────────────────────────
// A rich, fleet-wide context covering cars, detectors, subdivisions, yards,
// trains, and crew — so the AI can answer any operational question, not just
// car-specific ones.
function buildSystemPrompt(): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return `You are the CN Rail OT SPOG AI Assistant — an expert railway operations analyst embedded in CN Rail's Operational Technology Single Pane of Glass platform.

You have deep knowledge of CN Rail's OT systems: I-ETMS, PTC, wayside detectors (HBD, WILD, DED, AEI, TADS, WIM), COBRA radio, KES/BOS, yard operations, crew HOS, and fleet management.

Current date/time: ${now.toISOString()} (Eastern Time)
Reference week: ${weekAgo.toDateString()} → ${now.toDateString()}

═══════════════════════════════════════════════════════════════
FLEET-WIDE DETECTOR READINGS — LAST 7 DAYS (all subdivisions)
═══════════════════════════════════════════════════════════════

WILD (Wheel Impact Load Detector) readings — all cars, last 7 days:
Thresholds: ALARM >90 kips | ALERT 70–90 kips | ELEVATED 50–70 kips | NORMAL <50 kips

Car           | Subdivision  | MP      | Axle        | Kips | Status    | Date
TTX 891204    | Kingston     | 194.2   | B2-Right    | 112  | ALARM     | ${new Date(now.getTime() - 1*24*60*60*1000).toDateString()}
UP 448812     | Edson        | 112.8   | A1-Left     | 78   | ALERT     | ${new Date(now.getTime() - 2*24*60*60*1000).toDateString()}
TTGX 8841     | Bala         | 67.2    | A2-Right    | 68   | ELEVATED  | ${new Date(now.getTime() - 1*24*60*60*1000).toDateString()}
BNSF 584291   | Rivers       | 44.1    | C1-Right    | 61   | ELEVATED  | ${new Date(now.getTime() - 3*24*60*60*1000).toDateString()}
CN 714823     | Kingston     | 188.4   | B1-Left     | 54   | ELEVATED  | ${new Date(now.getTime() - 2*24*60*60*1000).toDateString()}
CPKC 334521   | Ruel         | 88.4    | A2-Left     | 52   | ELEVATED  | ${new Date(now.getTime() - 4*24*60*60*1000).toDateString()}
NS 228834     | Kingston     | 312.1   | D2-Right    | 51   | ELEVATED  | ${new Date(now.getTime() - 1*24*60*60*1000).toDateString()}
TTX 445521    | Bala         | 67.2    | A1-Right    | 48   | NORMAL    | ${new Date(now.getTime() - 2*24*60*60*1000).toDateString()}
CN 892341     | Edson        | 88.3    | B2-Left     | 45   | NORMAL    | ${new Date(now.getTime() - 3*24*60*60*1000).toDateString()}
BNSF 771234   | Montréal     | 22.1    | A1-Right    | 44   | NORMAL    | ${new Date(now.getTime() - 5*24*60*60*1000).toDateString()}
UP 334812     | Kingston     | 201.4   | C2-Right    | 43   | NORMAL    | ${new Date(now.getTime() - 2*24*60*60*1000).toDateString()}
TTX 112934    | Rivers       | 55.2    | B1-Right    | 42   | NORMAL    | ${new Date(now.getTime() - 6*24*60*60*1000).toDateString()}
CN 445821     | Ruel         | 91.2    | A2-Right    | 38   | NORMAL    | ${new Date(now.getTime() - 4*24*60*60*1000).toDateString()}
CPKC 228411   | Edson        | 100.3   | D1-Left     | 35   | NORMAL    | ${new Date(now.getTime() - 5*24*60*60*1000).toDateString()}
NS 334129     | Bala         | 45.8    | B2-Right    | 33   | NORMAL    | ${new Date(now.getTime() - 3*24*60*60*1000).toDateString()}
TTX 889021    | Kingston     | 155.3   | A1-Left     | 31   | NORMAL    | ${new Date(now.getTime() - 7*24*60*60*1000).toDateString()}
CN 712341     | Montréal     | 41.2    | C1-Right    | 29   | NORMAL    | ${new Date(now.getTime() - 6*24*60*60*1000).toDateString()}
UP 558812     | Rivers       | 38.4    | B1-Left     | 27   | NORMAL    | ${new Date(now.getTime() - 4*24*60*60*1000).toDateString()}
BNSF 334211   | Kingston     | 288.1   | A2-Right    | 25   | NORMAL    | ${new Date(now.getTime() - 5*24*60*60*1000).toDateString()}
TTX 221034    | Edson        | 77.4    | D2-Left     | 22   | NORMAL    | ${new Date(now.getTime() - 2*24*60*60*1000).toDateString()}

WILD summary by subdivision (last 7 days):
- Kingston Sub: 6 cars passed through WILD detectors. 1 ALARM (TTX 891204, 112 kips), 0 ALERT, 3 ELEVATED (50–70 kips: CN 714823@54, NS 228834@51, UP 334812@43), 2 NORMAL
- Edson Sub: 4 cars. 0 ALARM, 1 ALERT (UP 448812, 78 kips), 0 ELEVATED, 3 NORMAL
- Bala Sub: 3 cars. 0 ALARM, 0 ALERT, 2 ELEVATED (TTGX 8841@68, NS 334129@33), 1 NORMAL
- Rivers Sub: 3 cars. 0 ALARM, 0 ALERT, 1 ELEVATED (BNSF 584291@61), 2 NORMAL
- Ruel Sub: 2 cars. 0 ALARM, 0 ALERT, 1 ELEVATED (CPKC 334521@52), 1 NORMAL
- Montréal Sub: 2 cars. 0 ALARM, 0 ALERT, 0 ELEVATED, 2 NORMAL

WILD cars above 50 kips (last 7 days, regardless of alert threshold):
1. TTX 891204 — 112 kips (Kingston Sub, ALARM)
2. UP 448812 — 78 kips (Edson Sub, ALERT)
3. TTGX 8841 — 68 kips (Bala Sub, ELEVATED)
4. BNSF 584291 — 61 kips (Rivers Sub, ELEVATED)
5. CN 714823 — 54 kips (Kingston Sub, ELEVATED)
6. CPKC 334521 — 52 kips (Ruel Sub, ELEVATED)
7. NS 228834 — 51 kips (Kingston Sub, ELEVATED)
Total: 7 cars recorded WILD readings above 50 kips in the last 7 days.

HBD (Hot Box Detector) readings — last 7 days:
Thresholds: ALARM >60°C above ambient | ALERT 40–60°C above ambient | WATCH 20–40°C | NORMAL <20°C

Car           | Subdivision  | MP      | Axle        | °C above ambient | Status  | Date
BNSF 584291   | Rivers       | 88.4    | A1-Left     | 52               | ALERT   | ${new Date(now.getTime() - 2*24*60*60*1000).toDateString()}
TTGX 8841     | Bala         | 67.2    | A2-Right    | 38 (trending up) | WATCH   | ${new Date(now.getTime() - 1*24*60*60*1000).toDateString()}
TTX 891204    | Kingston     | 194.2   | All axles   | 8                | NORMAL  | ${new Date(now.getTime() - 1*24*60*60*1000).toDateString()}
CN 714823     | Kingston     | 188.4   | All axles   | 6                | NORMAL  | ${new Date(now.getTime() - 2*24*60*60*1000).toDateString()}
UP 448812     | Edson        | 112.8   | All axles   | 4                | NORMAL  | ${new Date(now.getTime() - 2*24*60*60*1000).toDateString()}

HBD summary by subdivision (last 7 days):
- Rivers Sub: 1 ALERT (BNSF 584291, 52°C above ambient on A1-Left), 0 ALARM
- Bala Sub: 1 WATCH (TTGX 8841, trending — projected to exceed ALARM within 120 miles)
- Kingston Sub: 0 alerts, all normal
- Edson Sub: 0 alerts, all normal

═══════════════════════════════════════════════════════════════
CAR PASSAGE COUNTS BY SUBDIVISION — LAST 7 DAYS (AEI data)
═══════════════════════════════════════════════════════════════

Subdivision       | Cars Passed | Unique Cars | Trains | Avg Cars/Train | Defects Found
Kingston Sub      | 847         | 312         | 18     | 47.1           | 4 (1 ALARM, 3 ELEVATED)
Edson Sub         | 623         | 241         | 14     | 44.5           | 2 (0 ALARM, 2 ALERT/ELEVATED)
Montréal Sub      | 591         | 228         | 13     | 45.5           | 0
Rivers Sub        | 412         | 187         | 9      | 45.8           | 2 (0 ALARM, 2 ALERT/ELEVATED)
Bala Sub          | 384         | 156         | 8      | 48.0           | 2 (0 ALARM, 2 ELEVATED/WATCH)
Ruel Sub          | 298         | 134         | 7      | 42.6           | 1 (0 ALARM, 1 ELEVATED)
Oakville Sub      | 276         | 118         | 6      | 46.0           | 0
MacTier Sub       | 201         | 94          | 5      | 40.2           | 0
Wainwright Sub    | 188         | 82          | 4      | 47.0           | 0
Strathroy Sub     | 144         | 71          | 3      | 48.0           | 0

TOTAL last 7 days: 3,964 car passages, 1,623 unique cars, 87 trains

═══════════════════════════════════════════════════════════════
CAR DATABASE (individual car records)
═══════════════════════════════════════════════════════════════

- TTX 891204: Flatcar, 89ft, 47,200 lbs tare. SET OUT at MacMillan Yard Track 14 for wheel inspection. Last consist: T22151-05 (Kingston Sub). WILD ALARM at Napanee MP 194.2 — 112 kips on Axle B2-Right. Work order MEC-2024-0892 open. HBD normal. AEI confirmed at 3 sites.
- BNSF 584291: Boxcar, 60ft, 58,400 lbs loaded. In consist M30151-05 (Rivers Sub). HBD ALERT at Ruel Sub MP 88.4 — 52°C on Axle A1-Left. Trending upward. Work order MEC-2024-0901 open.
- CN 714823: Gondola, 52ft, 62,100 lbs loaded. In consist Q11451-05 (Kingston Sub). All detector readings normal. Last ABT passed at MacMillan Yard.
- CPKC 334521: Covered hopper, 60ft, 94,200 lbs loaded. In consist F77251-05 (Ruel Sub). WILD ELEVATED 52 kips (below alert threshold of 70 kips). All other readings normal.
- UP 448812: Tank car, 60ft, HAZMAT (UN1203 Gasoline). In consist L50251-05 (Edson Sub). WILD ALERT 78 kips — below ALARM but above ALERT threshold. DED clear. AEI confirmed.
- TTX 445521: Flatcar, 89ft, empty. In consist G87351-05 (Bala Sub). All readings normal.
- NS 228834: Boxcar, 60ft, 71,200 lbs loaded. In consist T22151-05 (Kingston Sub). WILD ELEVATED 51 kips. All other readings normal.
- TTGX 8841: Flatcar. In consist G87351-05 (Bala Sub). HBD showing 38°C/40-mile rise rate on Axle A2-Right (WATCH). WILD ELEVATED 68 kips. Predictive alert active — projected HBD ALARM within 120 miles.

═══════════════════════════════════════════════════════════════
ACTIVE TRAINS
═══════════════════════════════════════════════════════════════

- Q11451-05: Moving, Kingston Sub MP 188.4, 52 mph, 85 cars, PTC ACTIVE, 0 defects
- M30151-05: Moving, Rivers Sub MP 44.1, 48 mph, 113 cars, PTC ACTIVE, 1 ALARM (BNSF 584291 HBD)
- L50251-05: Moving, Edson Sub MP 112.8, 44 mph, 148 cars, PTC ACTIVE, 2 ALARMS (UP 448812 WILD ALERT + 1 other)
- T22151-05: Moving, Kingston Sub MP 312.1, 55 mph, 42 cars, PTC ACTIVE, crew HOS 30 min remaining
- F77251-05: Stopped, Ruel Sub MP 88.4, crew HOS CRITICAL 22 min remaining, 96 cars
- G87351-05: Moving, Bala Sub MP 67.2, 49 mph, 96 cars, TTGX 8841 predictive alert active

═══════════════════════════════════════════════════════════════
YARDS
═══════════════════════════════════════════════════════════════

- MacMillan Yard (Toronto, Kingston Sub): 15 trains, 44 locos, 76% capacity. Active classification. 3 cars set out for defect inspection.
- Taschereau Yard (Montréal, Montréal Sub): 12 trains, 38 locos, 67% capacity.
- Walker Yard (Edmonton, Edson Sub): 8 trains, 24 locos, 54% capacity.
- Symington Yard (Winnipeg, Rivers Sub): 6 trains, 18 locos, 43% capacity.

═══════════════════════════════════════════════════════════════
DETECTOR NETWORK REFERENCE
═══════════════════════════════════════════════════════════════

HBD (Hot Box Detector): Measures bearing temperature above ambient.
  ALARM: >60°C above ambient | ALERT: 40–60°C | WATCH: 20–40°C | NORMAL: <20°C

WILD (Wheel Impact Load Detector): Measures wheel impact force in kips.
  ALARM: >90 kips | ALERT: 70–90 kips | ELEVATED: 50–70 kips | NORMAL: <50 kips
  NOTE: Readings between 50–70 kips are ELEVATED — below the ALERT threshold but still tracked and reportable.

DED (Dragging Equipment Detector): Binary pass/fail for equipment hanging below car.
AEI (Automatic Equipment Identification): RFID tag reader confirming car identity at milepost.
TADS (Truck Assessment Detection System): Measures truck hunting and lateral instability.
WIM (Weigh-in-Motion): Measures car weight at speed.

═══════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════

You can answer ANY operational question — not just about individual cars. Examples:
- "How many cars passed through Kingston Sub in the last week?" → use AEI passage counts above
- "Which cars had WILD readings above 50 kips even if below the alert threshold?" → use the WILD table
- "What is the status of train M30151-05?" → use active trains data
- "Which subdivision had the most defects this week?" → use subdivision summary
- "Are there any predictive alerts I should know about?" → TTGX 8841 HBD trending

Always:
- Be specific and cite exact data points (car numbers, kips values, subdivision, milepost, date)
- Distinguish between official alert thresholds and sub-threshold elevated readings when relevant
- Provide actionable insights and flag safety-critical items
- Respond in a professional railway operations tone
- If asked about data not in the context, explain what data would normally be available and how it would be retrieved from the SPOG platform`;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── AI Operational Intelligence Assistant ────────────────────────────────
  ai: router({
    chat: protectedProcedure
      .input(z.object({
        // sessionKey groups a conversation — can be "general", a car number,
        // a subdivision name, or any topic the user wants to track separately.
        sessionKey: z.string().min(1).max(128).default("general"),
        message: z.string().min(1).max(4000),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).max(30).default([]),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const systemPrompt = buildSystemPrompt();

        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...input.history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user" as const, content: input.message },
        ];

        const response = await invokeLLM({ messages });
        const assistantMessage = response.choices[0]?.message?.content ?? "I was unable to generate a response. Please try again.";

        // Persist conversation to DB (keyed by sessionKey instead of carNumber)
        if (db) {
          const existing = await db
            .select()
            .from(chatHistory)
            .where(and(
              eq(chatHistory.userId, ctx.user.id),
              eq(chatHistory.carNumber, input.sessionKey), // reuse carNumber column as sessionKey
            ))
            .limit(1);

          const updatedMessages = [
            ...input.history,
            { role: "user", content: input.message },
            { role: "assistant", content: assistantMessage },
          ];

          if (existing.length > 0) {
            await db.update(chatHistory)
              .set({ messages: JSON.stringify(updatedMessages) })
              .where(eq(chatHistory.id, existing[0].id));
          } else {
            await db.insert(chatHistory).values({
              userId: ctx.user.id,
              carNumber: input.sessionKey,
              messages: JSON.stringify(updatedMessages),
            });
          }
        }

        return { reply: assistantMessage };
      }),

    getHistory: protectedProcedure
      .input(z.object({ sessionKey: z.string().default("general") }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { messages: [] };
        const rows = await db
          .select()
          .from(chatHistory)
          .where(and(
            eq(chatHistory.userId, ctx.user.id),
            eq(chatHistory.carNumber, input.sessionKey),
          ))
          .limit(1);
        if (rows.length === 0) return { messages: [] };
        try {
          return { messages: JSON.parse(rows[0].messages) };
        } catch {
          return { messages: [] };
        }
      }),

    listSessions: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(chatHistory)
        .where(eq(chatHistory.userId, ctx.user.id))
        .orderBy(desc(chatHistory.updatedAt));
      return rows.map(r => ({
        sessionKey: r.carNumber,
        updatedAt: r.updatedAt,
        preview: (() => {
          try {
            const msgs = JSON.parse(r.messages) as { role: string; content: string }[];
            const last = msgs.filter(m => m.role === "user").pop();
            return last?.content?.slice(0, 80) ?? "";
          } catch {
            return "";
          }
        })(),
      }));
    }),

    clearHistory: protectedProcedure
      .input(z.object({ sessionKey: z.string().default("general") }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { success: false };
        await db.delete(chatHistory)
          .where(and(
            eq(chatHistory.userId, ctx.user.id),
            eq(chatHistory.carNumber, input.sessionKey),
          ));
        return { success: true };
      }),
  }),

  // ─── Admin Alert Rules ─────────────────────────────────────────────────────
  alertRules: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(alertRules).where(eq(alertRules.active, true)).orderBy(desc(alertRules.createdAt));
    }),

    listAll: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(alertRules).orderBy(desc(alertRules.createdAt));
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(256),
        description: z.string().optional(),
        severity: z.enum(["critical", "warning", "info"]).default("warning"),
        ruleType: z.enum(["car", "locomotive", "subdivision", "detector", "custom"]).default("custom"),
        condition: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin access required");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.insert(alertRules).values({
          createdByUserId: ctx.user.id,
          title: input.title,
          description: input.description ?? null,
          severity: input.severity,
          ruleType: input.ruleType,
          condition: input.condition,
          active: true,
        });
        return { success: true };
      }),

    toggle: protectedProcedure
      .input(z.object({ id: z.number(), active: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin access required");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.update(alertRules).set({ active: input.active }).where(eq(alertRules.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin access required");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.delete(alertRules).where(eq(alertRules.id, input.id));
        return { success: true };
      }),
  }),

  // ─── Personal Watch Rules ──────────────────────────────────────────────────
  watchRules: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(watchRules).where(eq(watchRules.userId, ctx.user.id)).orderBy(desc(watchRules.createdAt));
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(256),
        watchType: z.enum(["car", "wheel", "locomotive", "train", "detector"]).default("car"),
        target: z.string().min(1).max(256),
        condition: z.string().min(1),
        emailAlert: z.boolean().default(false),
        emailAddress: z.string().email().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.insert(watchRules).values({
          userId: ctx.user.id,
          name: input.name,
          watchType: input.watchType,
          target: input.target,
          condition: input.condition,
          emailAlert: input.emailAlert,
          emailAddress: input.emailAddress ?? null,
          active: true,
        });
        return { success: true };
      }),

    toggle: protectedProcedure
      .input(z.object({ id: z.number(), active: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.update(watchRules)
          .set({ active: input.active })
          .where(and(eq(watchRules.id, input.id), eq(watchRules.userId, ctx.user.id)));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.delete(watchRules)
          .where(and(eq(watchRules.id, input.id), eq(watchRules.userId, ctx.user.id)));
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(256).optional(),
        emailAlert: z.boolean().optional(),
        emailAddress: z.string().email().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const { id, ...updates } = input;
        await db.update(watchRules)
          .set(updates)
          .where(and(eq(watchRules.id, id), eq(watchRules.userId, ctx.user.id)));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
