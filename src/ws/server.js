import { WebSocketServer, WebSocket } from "ws";
import { wsArcjet } from "../arcjet";

const rooms = new Map();

// matchId → Set of sockets

function joinRoom(matchId, socket) {
  if (!rooms.has(matchId)) {
    rooms.set(matchId, new Set());
  }
  rooms.get(matchId).add(socket);
}

function leaveRoom(socket) {
  for (const [matchId, clients] of rooms.entries()) {
    if (clients.has(socket)) {
      clients.delete(socket);

      if (clients.size === 0) {
        rooms.delete(matchId);
      }
    }
  }
}

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;

  try {
    socket.send(JSON.stringify(payload));
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   Broadcast to specific match
========================= */

function broadcastToMatch(matchId, payload) {
  const clients = rooms.get(matchId);
  if (!clients) return;

  const message = JSON.stringify(payload);

  for (const client of clients) {
    if (client.readyState !== WebSocket.OPEN) continue;

    try {
      client.send(message);
    } catch (err) {
      console.error(err);
    }
  }
}

/* =========================
   WebSocket Server
========================= */
export function attachWebsocketServer(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (socket, req) => {
    console.log("Client connected");

    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);
        if (decision.isDenied()) {
          const code = decision.reason.isRateLimit() ? 1013 : 1008;
          const resion = decision.reason.isRateLimit()
            ? "Rate Limit Exceeded"
            : "Access Denied";
          socket.close(code, resion);
          return;
        }
      } catch (err) {
        console.log("WS Connection Error", err);
        socket.terminate();
        // socket.close(code, reason);
        return;
      }
    }

    socket.isAlive = true;

    sendJson(socket, { type: "welcome" });

    socket.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // 🔥 JOIN MATCH ROOM
        if (msg.type === "joinMatch") {
          joinRoom(msg.matchId, socket);

          sendJson(socket, {
            type: "joined",
            matchId: msg.matchId,
          });
        }
      } catch (err) {
        console.error("Invalid message", err);
      }
    });

    socket.on("close", () => {
      leaveRoom(socket);
      console.log("Client disconnected");
    });

    socket.on("pong", () => {
      socket.isAlive = true;
    });
  });

  /* =========================
     Heartbeat
  ========================= */
  setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.isAlive) return socket.terminate();

      socket.isAlive = false;
      socket.ping();
    }
  }, 30000);

  /* =========================
     External API (IMPORTANT)
  ========================= */
  function broadcastScoreUpdate(matchId, score) {
    broadcastToMatch(matchId, {
      type: "scoreUpdate",
      data: score,
    });
  }

  return {
    broadcastScoreUpdate,
  };
}
