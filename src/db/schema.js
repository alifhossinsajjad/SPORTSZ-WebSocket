import { pgTable, serial, varchar, integer, timestamp, jsonb, text, pgEnum, index } from "drizzle-orm/pg-core";

/**
 * Enum for game/match status
 */
export const matchStatusEnum = pgEnum("match_status", ["scheduled", "live", "finished"]);

/**
 * Matches Table - Stores primary information for sports matches
 */
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  sport: varchar("sport", { length: 100 }).notNull(),
  homeTeam: varchar("home_team", { length: 255 }).notNull(),
  awayTeam: varchar("away_team", { length: 255 }).notNull(),
  status: matchStatusEnum("status").notNull().default("scheduled"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  homeScore: integer("home_score").default(0).notNull(),
  awayScore: integer("away_score").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return [
    index("idx_matches_status").on(table.status),
    index("idx_matches_start_time").on(table.startTime),
  ];
});

/**
 * Commentary Table - Real-time play-by-play events and messages
 */
export const commentary = pgTable("commentary", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .references(() => matches.id, { onDelete: "cascade" })
    .notNull(),
  minute: integer("minute"),
  sequence: integer("sequence").notNull(), // To ensure proper ordering of events
  period: varchar("period", { length: 50 }),
  eventType: varchar("event_type", { length: 100 }),
  actor: varchar("actor", { length: 255 }),
  team: varchar("team", { length: 255 }),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return [
    index("idx_commentary_match_id").on(table.matchId),
    index("idx_commentary_sequence").on(table.sequence),
  ];
});

/**
 * Demo Users Table (Legacy/Demo support)
 */
export const demoUsers = pgTable("demo_users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
