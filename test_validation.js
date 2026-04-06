import { createCommentarySchema } from "./src/validation/commentary.js";

const testCases = [
  {
    name: "User's payload",
    payload: {
      minute: 42,
      sequence: 120,
      period: "3nd half",
      eventType: "goal",
      actor: "Alex Morgan",
      team: "FC Neon",
      message: "GOAL! Powerful finish from the edge of the box.",
      metadata: { assist: "Sam Kerr" },
      tags: ["goal", "shot"],
    }
  },
  {
    name: "3rd half variant",
    payload: {
      minute: 105,
      sequence: 150,
      period: "3rd half",
      eventType: "YELLOW_CARD",
      message: "Caution",
    }
  },
  {
    name: "1st half with space",
    payload: {
      minute: 15,
      sequence: 50,
      period: "1st half",
      eventType: "SUBSTITUTION",
      message: "Sub",
    }
  },
  {
    name: "Lowercase and spaces in event type",
    payload: {
      minute: 45,
      sequence: 90,
      period: "SECOND_HALF",
      eventType: "red card",
      message: "Red",
    }
  }
];

testCases.forEach(({ name, payload }) => {
  console.log(`\nTesting Case: ${name}`);
  const result = createCommentarySchema.safeParse(payload);
  if (result.success) {
    console.log("Validation Success!");
    console.log("Normalized Data:", JSON.stringify(result.data, null, 2));
  } else {
    console.error("Validation Failed!");
    console.error("Errors:", JSON.stringify(result.error.issues, null, 2));
  }
});

