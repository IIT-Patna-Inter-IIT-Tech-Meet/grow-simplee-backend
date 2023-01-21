import { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";

import {
    AdminAuthorizedRequest,
    AUTH_PRIVILEDGE,
    RiderAuthorizedRequest,
    SuperAdminAuthorizedRequest,
} from "../util/types";
import { TOKEN_SECRET } from "../util/config";

export const authorizationRider = (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies) return res.status(403).json({ success: false, message: "Forbidden" });

    const token = req.cookies.jwt;

    if (!token) return res.status(403).json({ success: false, message: "Forbidden" });

    try {
        const data = jwt.verify(token, TOKEN_SECRET);
        if (typeof data === "string" || data instanceof String)
            return res.status(403).json({ success: false, message: "Forbidden" });

        if (data.role !== AUTH_PRIVILEDGE.RIDER)
            return res.status(401).json({ success: false, message: "Unauthorized" });

        (req as RiderAuthorizedRequest).riderId = data.id;
        return next();
    } catch (e) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
};

export const authorizationAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies) return res.status(403).json({ success: false, message: "Forbidden" });

    const token = req.cookies.jwt;

    if (!token) return res.status(403).json({ success: false, message: "Forbidden" });

    try {
        const data = jwt.verify(token, TOKEN_SECRET);
        if (typeof data === "string" || data instanceof String)
            return res.status(403).json({ success: false, message: "Forbidden" });

        if (data.role !== AUTH_PRIVILEDGE.ADMIN || data.role !== AUTH_PRIVILEDGE.SUPER_ADMIN)
            return res.status(401).json({ success: false, message: "Unauthorized" });

        (req as AdminAuthorizedRequest).adminId = data.id;
        return next();
    } catch (e) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
};
export const authorizationSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies) return res.status(403).json({ success: false, message: "Forbidden" });

    const token = req.cookies.jwt;

    if (!token) return res.status(403).json({ success: false, message: "Forbidden" });

    try {
        const data = jwt.verify(token, TOKEN_SECRET);
        if (typeof data === "string" || data instanceof String)
            return res.status(403).json({ success: false, message: "Forbidden" });

        if (data.role !== AUTH_PRIVILEDGE.SUPER_ADMIN)
            return res.status(401).json({ success: false, message: "Unauthorized" });

        (req as SuperAdminAuthorizedRequest).adminId = data.id;
        return next();
    } catch (e) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
};

// NOTE: Doesn't give any data about the user, when logged in.
// Just checks if logged in as any user or not.
export const authorizationAll = (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies) return res.status(403).json({ success: false, message: "Forbidden" });

    const token = req.cookies.jwt;

    if (!token) return res.status(403).json({ success: false, message: "Forbidden" });

    try {
        const data = jwt.verify(token, TOKEN_SECRET);
        if (typeof data === "string" || data instanceof String)
            return res.status(403).json({ success: false, message: "Forbidden" });

        return next();
    } catch (e) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
};

export const authorization = (role: AUTH_PRIVILEDGE) => {
    switch (role) {
        case AUTH_PRIVILEDGE.SUPER_ADMIN:
            return authorizationSuperAdmin;
        case AUTH_PRIVILEDGE.ADMIN:
            return authorizationAdmin;
        case AUTH_PRIVILEDGE.RIDER:
            return authorizationRider;
        case AUTH_PRIVILEDGE.ALL:
            return authorizationAll;
        default:
            throw "UNREACHABLE";
    }
};
