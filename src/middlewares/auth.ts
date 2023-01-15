import { NextFunction, Response, Request } from 'express'
import jwt from 'jsonwebtoken';

import { RiderAuthorisedRequest } from '../util/types';
import { TOKEN_SECRET } from '../util/config';

export const authorization = (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies) return res
        .status(403)
        .json({ success: false, message: "Forbidden" });

    const token = req.cookies.jwt;

    if (!token) return res
        .status(403)
        .json({ success: false, message: "Forbidden" })

    try {
        const data = jwt.verify(token, TOKEN_SECRET);
        if (typeof data === 'string' || data instanceof String)
            return res
                .status(403)
                .json({ success: false, message: "Forbidden" });

        (req as RiderAuthorisedRequest).riderId = data.id;
        return next();
    } catch (e) {
        return res
            .status(403)
            .json({ success: false, message: "Forbidden" })
    }
};
