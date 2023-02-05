import { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";
import { Socket } from "socket.io";

import {
    AdminAuthorizedRequest,
    AdminSocket,
    AUTH_PRIVILEGE,
    RiderAuthorizedRequest,
    RiderSocket,
    SuperAdminAuthorizedRequest,
    UserSocket,
} from "../util/types";
import { TOKEN_SECRET } from "../config/config";

export const authorization = (role: AUTH_PRIVILEGE | AUTH_PRIVILEGE[]) => {
    if (typeof role === "number") role = [role];

    // type of role here is always AUTH_PRIVILEGE[]

    const roles = role;

    // SUPER_ADMIN must have all privileges as ADMIN
    if (roles.includes(AUTH_PRIVILEGE.ADMIN)) roles.push(AUTH_PRIVILEGE.SUPER_ADMIN);

    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.cookies) return res.status(403).json({ success: false, message: "Forbidden" });

        const token = req.cookies.jwt;

        if (!token) return res.status(403).json({ success: false, message: "Forbidden" });

        try {
            const data = jwt.verify(token, TOKEN_SECRET);
            if (typeof data === "string" || data instanceof String)
                return res.status(403).json({ success: false, message: "Forbidden" });

            if (!roles.includes(data.role))
                return res.status(403).json({ success: false, message: "Forbidden" });

            switch (data.role) {
                case AUTH_PRIVILEGE.ADMIN:
                    (req as AdminAuthorizedRequest).adminId = data.id;
                    break;
                case AUTH_PRIVILEGE.SUPER_ADMIN:
                    (req as SuperAdminAuthorizedRequest).adminId = data.id;
                    break;
                case AUTH_PRIVILEGE.RIDER:
                    (req as RiderAuthorizedRequest).riderId = data.id;
                    break;
                default:
                    throw "UNREACHABLE";
            }

            return next();
        } catch (e) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
    };
};

const parseCookies = (cookiesString: string | undefined) => {
    if (!cookiesString) throw "Did not find any cookie!";

    const cookies: { [key: string]: string } = {};
    cookiesString.split(";").forEach((cookieKeyValue) => {
        const [key, value] = cookieKeyValue.trim().split("=");
        cookies[key] = value;
    });

    return cookies;
};

export const socketAuthorization = (socket: Socket, next: (err?: Error | undefined) => void) => {
    try {
        const cookies = parseCookies(socket.handshake.headers["cookie"]);

        if (!cookies.jwt) return next(new Error("JWT not found!"));

        const token = cookies.jwt;
        const data = jwt.verify(token, TOKEN_SECRET);

        if (typeof data === "string" || data instanceof String)
            return next(new Error("Invalid JWT"));

        (socket as UserSocket).role = data.role;
        switch (data.role) {
            case AUTH_PRIVILEGE.RIDER:
                (socket as RiderSocket).riderId = data.id;
                break;
            case AUTH_PRIVILEGE.ADMIN:
            case AUTH_PRIVILEGE.SUPER_ADMIN:
                (socket as AdminSocket).adminId = data.id;
                break;
            default:
                throw "UNREACHABLE";
        }

        next();
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);

        return next(new Error(`${e}`));
    }
};
