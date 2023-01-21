import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { COOKIE_CONFIG, TOKEN_SECRET } from "../util/config";
import { transporter } from "../util/mail";
import { AUTH_PRIVILEDGE } from "../util/types";
import { generateOTP, serializeRider } from "../util/auth";

const prisma = new PrismaClient();

// ----------LOGIN route----------
// * route_type: public
// * relative url: /rider/login
// * method: POST
// * cookies: SETS 'jwt'
// * status_codes_returned: 200, 400, 401, 500
export const login = async (req: Request, res: Response) => {
    // Fields for login: req.body.email and req.body.password
    const { body } = req;
    if (!body || !body.email || !body.password) {
        return res.status(400).json({ success: false, message: "Malformed request" });
    }

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

        const token = jwt.sign({ id: rider.id, role: AUTH_PRIVILEDGE.RIDER }, TOKEN_SECRET);

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
export const forgotPassword = async (req: Request, res: Response) => {
    const { body } = req;

    if (!body || !body.email) {
        return res.status(400).json({ success: false, message: "Malformed body" });
    }

    const { email } = body;

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
export const resetPassword = async (req: Request, res: Response) => {
    const { body } = req;

    if (!body || !body.email || !body.otp || !body.password) {
        return res.status(400).json({ success: false, message: "Malformed body" });
    }

    const { email, otp, password } = body;

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
