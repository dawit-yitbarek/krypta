import express from "express";
import cors from "cors";
import { PORT, FRONTEND_URL, NODE_ENV } from "./config/env.js";
import candleRoute from "./routes/candleRoute.js";
import coinRoute from "./routes/coinRoute.js";
import { initializeWebSocketServer } from "./server.js";
import logger from "./config/logger.js";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: NODE_ENV === "development" ? true : [FRONTEND_URL as string,],
    credentials: true,
  }),
);

app.use('/api/candles', candleRoute);
app.use('/api/coins', coinRoute);

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
});

initializeWebSocketServer(server);

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message || err}`);
  logger.error(err.stack);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});