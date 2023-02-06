import { NextFunction, Request, Response } from "express";
import { Server } from "socket.io";
import { IORequest } from "../util/types";

export const populateRequestWithIO =
    (io: Server) => (req: Request, _: Response, next: NextFunction) => {
        (req as IORequest).io = io;
        return next();
    };
