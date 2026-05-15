import express from "express";
import cors from "cors";
import healthRouter from "./routes/health";
import consumptionsRouter from "./routes/consumptions";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/health", healthRouter);
app.use("/consumptions", consumptionsRouter);

export default app;
