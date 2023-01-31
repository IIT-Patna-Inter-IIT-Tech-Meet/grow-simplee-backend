import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { CLIENT_URL } from "./util/config";

import riderRouter from "./routes/rider";
import adminRouter from "./routes/admin";
import packageRouter from "./routes/packages";

const app: Express = express();

//----------MIDDLEWARE----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// CORS
app.use(cors({
    origin: CLIENT_URL,
    credentials: true
}));

//----------ROUTES----------
app.use("/rider", riderRouter);
app.use("/admin", adminRouter);
app.use("/package", packageRouter);

export default app;
