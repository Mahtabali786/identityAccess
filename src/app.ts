import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { authRoutes } from "./routes/auth.routes";
import { userRoutes } from "./routes/user.routes";
import { notFound, errorHandler } from "./middleware/error-handler";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "20kb" }));

app.get("/health", (_req, res) => res.status(200).json({ data: { status: "ok" } }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);