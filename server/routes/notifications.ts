import { RequestHandler, Response } from "express";
import { getProducts } from "./products";

let lastInventorySnapshot = JSON.stringify(getProducts());
const clients = new Set<Response>();

const sendInventory = (client: Response) => {
  client.write(`data: ${JSON.stringify({ type: "inventory", products: getProducts() })}\n\n`);
};

export const handleNotificationStream: RequestHandler = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.add(res);
  sendInventory(res);

  const heartbeat = setInterval(() => res.write(": keep-alive\n\n"), 25000);
  const removeClient = () => {
    clearInterval(heartbeat);
    clients.delete(res);
  };

  req.on("close", removeClient);
  res.on("error", removeClient);
};

export const broadcastInventoryUpdate = () => {
  for (const client of clients) {
    try {
      sendInventory(client);
    } catch {
      clients.delete(client);
    }
  }
};

setInterval(() => {
  const nextSnapshot = JSON.stringify(getProducts());
  if (nextSnapshot !== lastInventorySnapshot) {
    lastInventorySnapshot = nextSnapshot;
    broadcastInventoryUpdate();
  }
}, 5000);
