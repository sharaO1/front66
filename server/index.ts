import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSalesSummary } from "./routes/sales";
import { handleProducts } from "./routes/products";
import { handleNotificationStream } from "./routes/notifications";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/dashboard/sales-summary", handleSalesSummary);
  app.get("/api/products", handleProducts);
  app.get("/api/notifications/stream", handleNotificationStream);

  // Simple fallback RBAC routes for development (without shared imports)
  app.get("/api/admin/users", (_req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: "1",
          name: "Admin",
          email: "admin@example.com",
          role: "super_admin",
          status: "active",
        },
        {
          id: "2",
          name: "Manager",
          email: "manager@example.com",
          role: "manager",
          status: "active",
        },
        {
          id: "3",
          name: "Employee",
          email: "employee@example.com",
          role: "employee",
          status: "active",
        },
      ],
    });
  });

  app.get("/api/admin/roles", (_req, res) => {
    res.json({
      success: true,
      data: [
        { role: "super_admin", label: "Super Admin" },
        { role: "admin", label: "Admin" },
        { role: "manager", label: "Manager" },
        { role: "employee", label: "Employee" },
      ],
    });
  });

  app.put("/api/admin/users/:id/role", (_req, res) => {
    res.json({ success: true, message: "Role updated successfully" });
  });

  app.put("/api/admin/users/:id/status", (_req, res) => {
    res.json({ success: true, message: "Status updated successfully" });
  });

  app.get("/api/permissions/check", (_req, res) => {
    res.json({ success: true, hasPermission: true });
  });

  app.get("/api/admin/audit-logs", (_req, res) => {
    res.json({ success: true, data: [] });
  });

  return app;
}
