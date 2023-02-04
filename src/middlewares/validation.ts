import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";

export const validate =
    (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
            });
            return next();
        } catch (e) {
            console.error(`[#] ERROR: ${e}`);
            return res.status(400).json({ success: false, message: "Malformed request", error: e });
        }
    };
