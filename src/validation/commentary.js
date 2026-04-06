import { z } from "zod";
export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createCommentarySchema = z.preprocess(
  (input) => {
    if (typeof input === "object" && input !== null) {
      const obj = { ...input };

      // 🔥 Fix common mistake automatically
      if (obj.metaData && !obj.metadata) {
        obj.metadata = obj.metaData;
        delete obj.metaData;
      }

      // 🔥 Normalize eventType (e.g., "goal" -> "GOAL")
      if (typeof obj.eventType === "string") {
        obj.eventType = obj.eventType.toUpperCase().replace(/\s+/g, "_");
      }

      // 🔥 Normalize period (e.g., "3nd half" -> "ET_FIRST_HALF")
      if (typeof obj.period === "string") {
        let p = obj.period.toUpperCase().replace(/\s+/g, "_");
        // Map common variations
        if (p === "1ST_HALF") p = "FIRST_HALF";
        if (p === "2ND_HALF") p = "SECOND_HALF";
        if (p === "3RD_HALF" || p === "3ND_HALF") p = "ET_FIRST_HALF";
        if (p === "4TH_HALF") p = "ET_SECOND_HALF";
        obj.period = p;
      }

      return obj;
    }
    return input;
  },
  z
    .object({
      minute: z.coerce.number().int().nonnegative(),

      sequence: z.coerce.number().int().nonnegative().optional(),

      period: z.enum([
        "FIRST_HALF",
        "SECOND_HALF",
        "ET_FIRST_HALF",
        "ET_SECOND_HALF",
        "PENALTIES",
      ]),

      eventType: z.enum(["GOAL", "YELLOW_CARD", "RED_CARD", "SUBSTITUTION"]),

      actor: z.string().min(1).max(100).optional(),
      team: z.string().min(1).max(100).optional(),

      message: z.string().min(1),

      metadata: z.record(z.string(), z.unknown()).optional(),

      tags: z.array(z.string().min(1)).max(10).optional(),
    })
    .strict(),
);
