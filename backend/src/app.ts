import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { healthRouter } from "./routes/health.routes";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(process.env.NODE_ENV === "test" ? "tiny" : "dev"));

  app.use("/health", healthRouter);

  app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

  return app;
}
