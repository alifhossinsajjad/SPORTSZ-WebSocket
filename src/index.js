import cors from "cors";
import express from "express";
import http from "http";
import { attachWebsocketServer } from "../src/ws/server.js";
import { securityMiddleware } from "./arcjet.js";
import { commentaryRouter } from "./routes/commentary.js";
import { matchRouter } from "./routes/matches.js";

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "0.0.0.0";

const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Sports Server run successfully");
});

app.use(securityMiddleware());

app.use("/matches", matchRouter);
app.use("/matches/:id/commentary", commentaryRouter);

/* WebSocket */
const { broadcastMatchCreated, broadcastCommentary } =
  attachWebsocketServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}: ${PORT}`;

  console.log(`server running on the : ${baseUrl}`);
  console.log(
    `WebSocket Sever is running on : ${baseUrl.replace("http", "ws")}/ws`,
  );
});
