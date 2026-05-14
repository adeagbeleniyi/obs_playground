import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Admin-created broadcast alert rules — visible to all users on the Incidents page.
 */
export const alertRules = mysqlTable("alert_rules", {
  id: int("id").autoincrement().primaryKey(),
  createdByUserId: int("createdByUserId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  severity: mysqlEnum("severity", ["critical", "warning", "info"]).default("warning").notNull(),
  ruleType: mysqlEnum("ruleType", ["car", "locomotive", "subdivision", "detector", "custom"]).default("custom").notNull(),
  /** JSON-encoded rule condition, e.g. { carNumber: "TTX 891204", metric: "wheel_impact", threshold: 90 } */
  condition: text("condition").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = typeof alertRules.$inferInsert;

/**
 * Per-user personal watch rules — shown only on the creating user's screen.
 * Supports email notifications.
 */
export const watchRules = mysqlTable("watch_rules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  watchType: mysqlEnum("watchType", ["car", "wheel", "locomotive", "train", "detector"]).default("car").notNull(),
  /** The entity being watched, e.g. "TTX 891204" or "TTX 891204 / Axle A2-Right" */
  target: varchar("target", { length: 256 }).notNull(),
  /** JSON-encoded condition: { metric: "wheel_impact", operator: ">", threshold: 90 } */
  condition: text("condition").notNull(),
  emailAlert: boolean("emailAlert").default(false).notNull(),
  emailAddress: varchar("emailAddress", { length: 320 }),
  active: boolean("active").default(true).notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WatchRule = typeof watchRules.$inferSelect;
export type InsertWatchRule = typeof watchRules.$inferInsert;

/**
 * Chat history for the AI Car Assistant — stores conversation per user per car.
 */
export const chatHistory = mysqlTable("chat_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  carNumber: varchar("carNumber", { length: 64 }).notNull(),
  /** JSON-encoded array of { role: 'user'|'assistant', content: string } */
  messages: text("messages").notNull().default("[]"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatHistory = typeof chatHistory.$inferSelect;
export type InsertChatHistory = typeof chatHistory.$inferInsert;
