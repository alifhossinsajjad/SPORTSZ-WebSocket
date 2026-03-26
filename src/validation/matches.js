import { z } from "zod";

/**
 * Constants for match status to maintain consistency across the application
 */
export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
};

/**
 * Schema for validating pagination/limit queries
 * Coerces string query params to numbers
 */
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Schema for validating route parameters that contain a match ID
 */
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Helper to validate ISO Date strings
 */
const isoDateSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid ISO date string",
});

/**
 * Schema for creating a new match
 */
export const createMatchSchema = z
  .object({
    sport: z.string().trim().min(1, "Sport is required"),
    homeTeam: z.string().trim().min(1, "Home team is required"),
    awayTeam: z.string().trim().min(1, "Away team is required"),
    startTime: isoDateSchema,
    endTime: isoDateSchema,
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    // Check if both dates are valid before comparing
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endTime must be chronologically after the startTime",
        path: ["endTime"],
      });
    }
  });

/**
 * Schema for updating match scores
 */
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
