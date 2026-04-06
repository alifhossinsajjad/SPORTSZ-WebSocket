import { Router } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm";

export const matchRouter = Router();

const Max_limit = 100;

matchRouter.get("/", async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid payload.",
      details: parsed.error.issues,
    });
  }

  const limit = Math.min(parsed.data.limit ?? 50, Max_limit);

  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    res.status(200).json({ data });
  } catch (e) {
    res.status(500).json({
      error: "Failed to fetch matches.",
      details: e.message,
    });
  }
});

matchRouter.post("/", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid payload.",
      details: parsed.error.issues,
    });
  }

  try {
    const [event] = await db.insert(matches).values({
      ...parsed.data,
      startTime: new Date(parsed.data.startTime),
      endTime: new Date(parsed.data.endTime),
      homeScore: parsed.data.homeScore ?? 0,
      awayScore: parsed.data.awayScore ?? 0,
      status: getMatchStatus(parsed.data.startTime, parsed.data.endTime),
    }).returning();

    console.log("broadcast fn:", res.app.locals.broadcastMatchCreated);

    res.status(201).json({ data: event });

    if (res.app.locals.broadcastMatchCreated) {
      res.app.locals.broadcastMatchCreated(event);
    }

  } catch (e) {
    res.status(500).json({
      error: "Failed to create match .",
      details: e.message,
    });
  }
});
