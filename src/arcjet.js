import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey) {
  console.warn("ARCJET disabled (no key provided)");
}

/* shared rules */
const baseRules = [
  shield({ mode: arcjetMode }),
  detectBot({
    mode: arcjetMode,
    allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
  }),
];

/* HTTP protection */
export const httpArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [...baseRules, slidingWindow({ interval: "10s", max: 50 })],
    })
  : null;

/* WS protection */
export const wsArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [...baseRules, slidingWindow({ interval: "2s", max: 5 })],
    })
  : null;

/* Express middleware */
export function securityMiddleware() {
  return async (req, res, next) => {
    if (!httpArcjet) return next();

    try {
      const decision = await httpArcjet.protect(req);

      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({ error: "Too Many Requests" });
        }
        return res.status(403).json({ error: "Forbidden" });
      }

      next();
    } catch (err) {
      console.error("Arcjet middleware error:", err);
      return res.status(503).json({ error: "Service Unavailable" });
    }
  };
}
