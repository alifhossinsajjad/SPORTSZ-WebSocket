import { WebSocketServer, WebSocket } from "ws";
import { wsArcjet } from "../arcjet.js";

/* 
   In-memory room system
 */
const rooms = new Map(); // matchId → Set<socket>

/* 
   Helpers
 */

function safeSend(socket, message) {
  if (socket.readyState !== WebSocket.OPEN) return;

  // prevent memory overload (backpressure)
  if (socket.bufferedAmount > 1_000_000) {
    console.warn("Skipping slow client");
    return;
  }

  try {
    socket.send(message);
  } catch (err) {
    console.error("Send error:", err);
  }
}

function sendJson(socket, payload) {
  safeSend(socket, JSON.stringify(payload));
}

function joinRoom(matchId, socket) {
  if (!rooms.has(matchId)) {
    rooms.set(matchId, new Set());
  }

  rooms.get(matchId).add(socket);
  socket.matchId = matchId; // ✅ track for cleanup
}

function leaveRoom(socket) {
  const matchId = socket.matchId;
  if (!matchId) return;

  const clients = rooms.get(matchId);
  if (!clients) return;

  clients.delete(socket);

  if (clients.size === 0) {
    rooms.delete(matchId);
  }
}

function broadcastToMatch(matchId, payload) {
  const clients = rooms.get(matchId);
  if (!clients) return;

  const message = JSON.stringify(payload);

  for (const client of clients) {
    safeSend(client, message);
  }
}

/* 
   Arcjet Wrapper (clean)
 */
async function protectSocket(req, socket) {
  if (!wsArcjet) return true;

  try {
    const decision = await wsArcjet.protect(req);

    if (decision.isDenied()) {
      const code = decision.reason.isRateLimit() ? 1013 : 1008;
      const reason = decision.reason.isRateLimit()
        ? "Rate limit exceeded"
        : "Access denied";

      socket.close(code, reason);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Arcjet error:", err);
    socket.terminate();
    return false;
  }
}

/* 
   WebSocket Server
 */

export function attachWebsocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024, // 1MB
  });

  wss.on("connection", async (socket, req) => {
    console.info("WS connected");

    const allowed = await protectSocket(req, socket);
    if (!allowed) return;

    socket.isAlive = true;

    sendJson(socket, { type: "welcome" });

    socket.on("message", (data) => {
      try {
        if (data.length > 1_000_000) {
          throw new Error("Payload too large");
        }

        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          case "joinMatch":
            joinRoom(msg.matchId, socket);

            sendJson(socket, {
              type: "joined",
              matchId: msg.matchId,
            });
            break;

          default:
            console.warn("Unknown message type:", msg.type);
        }
      } catch (err) {
        console.error("Message error:", err.message);
        sendJson(socket, { type: "error", message: "Invalid message" });
      }
    });

    socket.on("close", () => {
      leaveRoom(socket);
      console.info("WS disconnected");
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });

    socket.on("pong", () => {
      socket.isAlive = true;
    });
  });

  /*
     Heartbeat (FIXED)
  */
  const interval = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.isAlive) {
        socket.terminate();
        continue; // ✅ FIXED
      }

      socket.isAlive = false;
      socket.ping();
    }
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  /* 
     External API
   */
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
