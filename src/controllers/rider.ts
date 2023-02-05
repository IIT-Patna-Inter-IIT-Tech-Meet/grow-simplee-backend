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

// id       String  @id @db.VarChar(50)
// name     String  @db.VarChar(100)
// phoneno  String? @db.VarChar(20)
// onduty   Boolean
// email    String  @unique @db.VarChar(50)
// password String  @db.VarChar(80)

// vehicleId String? @map("vehicle_id") @db.VarChar(20)

// drivingLicense String?     @map("driving_license")
// bloodGroup     BloodGroup? @map("blood_group")
// otp            String?     @db.VarChar(10)
// otpExpireTime  DateTime?   @map("otp_expire_time")
// -------UPDATE-RIDER route----------
// * route_type: private/authorized
// * relative url: /rider/update
// * method: POST
// * status_codes_returned: 200
export const updateRiderSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        phoneno: z.string().optional(),
        password: z.string().optional(),
        vehicleId: z.string().optional(),
        drivingLicense: z.string().optional(),
        onduty: z.boolean().optional(),
    }),
});
export const updateRider = async (_req: Request, res: Response) => {
    const req = _req as RiderAuthorizedRequest;

    if (req.body.id || req.body.email) {
        return res.status(403).json({ success: false, message: "Some field(s) cannot be updated" });
    }

    const {
        body: { name, phoneno, password, vehicleId, drivingLicense, onduty },
    } = req as unknown as z.infer<typeof updateRiderSchema>;

    try {
        let hashedPassword = password;
        if (hashedPassword) {
            const salt = await bcrypt.genSalt();
            hashedPassword = await bcrypt.hash(hashedPassword, salt);
        }

        const rider = await prisma.rider.update({
            where: { id: req.riderId },
            data: {
                name,
                phoneno,
                vehicleId,
                drivingLicense,
                onduty,
                password: hashedPassword,
            },
        });

        return res
            .status(200)
            .json({ success: true, message: "Updated 1 Rider!", rider: serializeRider(rider) });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// -------DELIVERIES route----------
// * route_type: private/authorized
// * relative url: /rider/past-deliveries
// * method: POST
// * status_codes_returned: 200
export const getPastDeliveriesSchema = z.object({
    body: z.object({
        start: z
            .string()
            .datetime()
            .default(new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000).toJSON()), // 2 weeks
        end: z.string().datetime().default(new Date(Date.now()).toJSON()),
        page: z.number().gte(0).default(1),
        limit: z.number().gte(0).lte(10).default(10),
    }),
});
export const getPastDeliveries = async (_req: Request, res: Response) => {
    const req = _req as RiderAuthorizedRequest;

    const {
        body: { start, end, limit, page },
    } = req as unknown as z.infer<typeof getPastDeliveriesSchema>;

    try {
        const deliveries = await prisma.archivedDelivery.findMany({
            skip: limit * (page - 1),
            take: limit,
            where: {
                AND: [{ riderId: req.riderId }, { deliveryTimestamp: { lte: end, gte: start } }],
            },
            select: {
                id: true,
                AWB: true,
                deliveryTimestamp: true,
                customer: {
                    select: {
                        address: true,
                        name: true,
                    },
                },
            },
        });

        return res
            .status(200)
            .json({ success: true, message: `Found ${deliveries.length} deliveries!`, deliveries });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
    }
};
