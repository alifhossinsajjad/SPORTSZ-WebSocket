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
