import { Router } from "express";
import { createMatchSchema } from "../validation/matches";

export const matchRouter = Router();

matchRouter.get("/", (req, res) => {
  res.status(200).json({ message: "Match list" });
});

matchRouter.post("/", (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);
});
