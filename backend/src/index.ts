import express from "express";
import cors from "cors";
import { PORT, FRONTEND_URL } from "./config/env.js";
import candleRoute from "./routes/candleRoute.js";
import coinRoute from "./routes/coinRoute.js";
import { initializeWebSocketServer } from "./server.js";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [FRONTEND_URL as string,],
    credentials: true,
  }),
);

app.use('/api/candles', candleRoute);
app.use('/api/coins', coinRoute);

const server = app.listen(PORT || 5000, () => {
  console.log(`Server running on port ${PORT || 5000}`);
});

initializeWebSocketServer(server);

process.on("uncaughtException", (err) => {
  console.error(`Uncaught Exception: ${err.message || err}`);
  console.error(err.stack);
});

process.on("unhandledRejection", (reason) => {
  console.error(`Unhandled Rejection: ${reason}`);
});