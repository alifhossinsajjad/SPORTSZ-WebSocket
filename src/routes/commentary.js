import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary";
import { matchIdParamSchema } from "../validation/matches.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

/* ─── GET /matches/:id/commentary ───────────────── */
commentaryRouter.get("/", async (req, res) => {
  const parsedParam = matchIdParamSchema.safeParse(req.params);

  if (!parsedParam.success) {
    return res.status(400).json({
      error: "Invalid route parameter.",
      details: parsedParam.error.issues,
    });
  }

  const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    return res.status(400).json({
      error: "Invalid query parameter.",
      details: parsedQuery.error.issues,
    });
  }

  const matchId = parsedParam.data.id;
  const limit = Math.min(parsedQuery.data.limit ?? MAX_LIMIT, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    return res.status(200).json({ data });
  } catch (e) {
    console.error(e); // 🔥 important

    return res.status(500).json({
      error: "Failed to fetch commentary.",
    });
  }
});

// ─── POST /matches/:id/commentary ────────────────────────────────────────────

commentaryRouter.post("/", async (req, res) => {
  // 1. Validate route param (:id → matchId)
  const parsedParam = matchIdParamSchema.safeParse(req.params);

  if (!parsedParam.success) {
    return res.status(400).json({
      error: "Invalid route parameter.",
      details: parsedParam.error.issues,
    });
  }

  // 2. Validate request body
  const parsedBody = createCommentarySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      error: "Invalid payload.",
      details: parsedBody.error.issues,
    });
  }

  const matchId = parsedParam.data.id;
  const {
    minute,
    sequence,
    period,
    eventType,
    actor,
    team,
    message,
    metadata,
    tags,
  } = parsedBody.data;

  // 3. Insert into the commentary table and return the created row
  try {
    const [entry] = await db
      .insert(commentary)
      .values({
        matchId,
        minute,
        sequence: sequence ?? 0,
        period,
        eventType,
        actor,
        team,
        message,
        metadata,
        tags,
      })
      .returning();

    if (res.app.locals.broadcastCommentary){
      res.app.locals.broadcastCommentary(entry.matchId, entry);
    }
      return res.status(201).json({ data: entry });
  } catch (e) {
    return res.status(500).json({
      error: "Failed to create commentary entry.",
      details: e.message,
    });
  }
});
