import http from "http";
import express from "express";
import cors from "cors";
import { matchRouter } from "./routes/matches.js";
import { attachWebsocketServer } from "./ws/server.js";

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "0.0.0.0";

const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Sports Server run successfully");
});

app.use("/matches", matchRouter);

const { broadcastMatchCreated } = attachWebsocketServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}: ${PORT}`;



  console.log(`server running on the : ${baseUrl}`);
console.log(`WebSocket Sever is running on : ${baseUrl.replace("http", "ws")}/ws`)



});
