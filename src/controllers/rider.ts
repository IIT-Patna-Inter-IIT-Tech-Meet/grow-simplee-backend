import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { COOKIE_CONFIG, TOKEN_SECRET } from "../config/config";
import { transporter } from "../util/mail";
import { AUTH_PRIVILEGE, RiderAuthorizedRequest } from "../util/types";
import { generateOTP, serializeRider } from "../util/auth";

import { prisma } from "../util/prisma";

// ----------LOGIN route----------
// * route_type: public
// * relative url: /rider/login
// * method: POST
// * cookies: SETS 'jwt'
// * status_codes_returned: 200, 400, 401, 500
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});
export const login = async (req: Request, res: Response) => {
    // Fields for login: req.body.email and req.body.password
    const { email, password } = req.body;

    try {
        const rider = await prisma.rider.findUnique({ where: { email } });

        if (!rider) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const result = await bcrypt.compare(password, rider.password);

        if (!result) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const token = jwt.sign({ id: rider.id, role: AUTH_PRIVILEGE.RIDER }, TOKEN_SECRET, {
            expiresIn: "10d", // setting expiration time of the jwt
        });

        return res
            .cookie("jwt", token, COOKIE_CONFIG)
            .status(200)
            .json({
                success: true,
                message: "Login Successful!",
                rider: serializeRider(rider),
            });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// ----------LOGOUT route----------
// * route_type: private/authorized
// * relative url: /rider/logout
// * method: POST
// * cookies: UNSETS 'jwt'
// * status_codes_returned: 200
export const logout = (_: Request, res: Response) => {
    return res
        .clearCookie("jwt")
        .status(200)
        .json({ success: true, message: "Logged out successfully!" });
};

// ----------FORGOT PASSWORD route----------
// * route_type: public
// * relative url: /rider/forgot-password
// * method: POST
// * status_codes_returned: 200
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email(),
    }),
});
export const forgotPassword = async (req: Request, res: Response) => {
    const {
        body: { email },
    } = req;

    try {
        const OTP = generateOTP(6);
        const mailOptions = {
            from: "noreply@gs.com",
            to: email,
            subject: "Request for resetting password.",
            text: `OTP: ${OTP}`,
        };

        await prisma.rider.update({
            where: { email: email },
            data: { otp: OTP, otpExpireTime: new Date(Date.now() + 20 * 60 * 1000) }, // 20 minutes
        });

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ success: true, message: "Mail sent successfully!" });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// ----------RESET PASSWORD route----------
// * route_type: public
// * relative url: /rider/reset-password
// * method: POST
// * cookies: SETS 'jwt'
// * status_codes_returned: 200
export const resetPasswordSchema = z.object({
    body: z.object({
        email: z.string().email(),
        otp: z.number(),
        password: z.string(),
    }),
});
export const resetPassword = async (req: Request, res: Response) => {
    const { email, otp, password } = req.body;

    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // WARNING: Can it really update many though?
        // since one of the conditions of WHERE involves
        // equality of `email`.
        const rider = await prisma.rider.updateMany({
            where: {
                AND: [
                    { email: { equals: email } },
                    { otp: { equals: otp } },
                    { otpExpireTime: { gt: new Date(Date.now()) } },
                ],
            },
            data: {
                password: hashedPassword,
                otpExpireTime: new Date(Date.now() - 10 * 60 * 1000), // back date expiry
            },
        });

        if (rider.count !== 1) {
            return res.status(403).json({
                success: false,
                message: "OTP entered is either wrong, or has expired",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password set successfully!",
        });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(403).json({
                success: false,
                message: "OTP entered is either wrong, or has expired",
            });
        }
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// ----------GET-RIDER route----------
// * route_type: private/authorized
// * relative url: /rider/get-rider
// * method: GET
// * status_codes_returned: 200
export const getRider = async (_req: Request, res: Response) => {
    const req = _req as RiderAuthorizedRequest;
    const rider = await prisma.rider.findUnique({
        where: { id: req.riderId },
    });

    if (!rider) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    res.status(200).json({ success: true, message: "Valid Rider", rider: serializeRider(rider) });
};
