import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import { CLIENT_URL, APP_URL } from "./config/config";

import riderRouter from "./routes/rider";
import adminRouter from "./routes/admin";
import packageRouter from "./routes/packages";
import routingRouter from "./routes/routing";
import { socketAuthorization } from "./middlewares/auth";
import { handleSocketConnection } from "./sockets";

const app: Express = express();
const httpServer = createServer(app);

//----------SOCKET-----------
const io = new Server(httpServer, {
    cors: {
        origin: [CLIENT_URL, APP_URL],
        credentials: true,
    },
    cookie: true,
});
// AUTHORIZATION
io.use(socketAuthorization);
io.on("connection", handleSocketConnection(io));

//----------MIDDLEWARE----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// CORS
app.use(
    cors({
        origin: [CLIENT_URL, APP_URL],
        credentials: true,
    })
);

//----------ROUTES----------
app.use("/rider", riderRouter);
app.use("/admin", adminRouter);
app.use("/package", packageRouter);
app.use("/router", routingRouter);

export default httpServer;
