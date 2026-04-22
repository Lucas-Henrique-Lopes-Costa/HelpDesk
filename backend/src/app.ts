import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { errorHandler } from "./middleware/error-handler";
import { openApiSpec } from "./docs/openapi";

export function createApp(): Application {
  const app = express();

  // helmet precisa afrouxar CSP para o swagger-ui carregar seus inline scripts/styles
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(process.env.NODE_ENV === "test" ? "tiny" : "dev"));

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);

  app.get("/openapi.json", (_req, res) => res.json(openApiSpec));
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: "HelpDesk API — Docs",
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  app.use((_req, res) => res.status(404).json({ error: "Not Found" }));
  app.use(errorHandler);

  return app;
}
