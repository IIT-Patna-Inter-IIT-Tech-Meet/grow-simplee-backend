import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Delivery, InventoryItem, Pickup, Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { COOKIE_CONFIG, TOKEN_SECRET } from "../config/config";
import { transporter } from "../config/mail";
import { AUTH_PRIVILEGE, PackageDistAtom, RiderAuthorizedRequest } from "../util/types";
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

// -------PACKAGES route----------
// * route_type: private/authorized
// * relative url: /rider/past-packages
// * method: POST
// * status_codes_returned: 200
export const getPastDeliveriesSchema = z.object({
    body: z.object({
        start: z
            .string()
            .datetime()
            .default(new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000).toJSON()), // 2 weeks
        end: z.string().datetime().default(new Date(Date.now()).toJSON()),
    }),
});
export const getPastPackages = async (_req: Request, res: Response) => {
    const req = _req as RiderAuthorizedRequest;

    const {
        body: { start, end },
    } = await getPastDeliveriesSchema.parseAsync(req);

    let items: PackageDistAtom[] = [];
    try {
        const deliveries = await prisma.archivedDelivery.findMany({
            where: {
                AND: [{ riderId: req.riderId }, { deliveryTimestamp: { lte: end, gte: start } }],
            },
            select: {
                id: true,
                AWB: true,
                deliveryTimestamp: true,
                EDD: true,
                customer: {
                    select: {
                        address: true,
                        name: true,
                        latitude: true,
                        longitude: true,
                    },
                },
            },
            orderBy: { deliveryTimestamp: "desc" },
        });

        items = items.concat(deliveries.map((delivery) => ({ ...delivery, delivery: true })));

        const pickups = await prisma.archivedPickup.findMany({
            where: {
                AND: [{ riderId: req.riderId }, { pickupTimestamp: { lte: end, gte: start } }],
            },
            select: {
                id: true,
                AWB: true,
                EDP: true,
                pickupTimestamp: true,
                customer: {
                    select: {
                        address: true,
                        name: true,
                        latitude: true,
                        longitude: true,
                    },
                },
            },
            orderBy: { pickupTimestamp: "desc" },
        });

        items = items.concat(pickups.map((pickup) => ({ ...pickup, delivery: false })));

        return res
            .status(200)
            .json({ success: true, message: `Found ${items.length} packages!`, packages: items });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
    }
};

type DeliveryWithItems = Delivery & {
    items: InventoryItem[];
};
const cascadeDeleteDelivery = async (delivery: DeliveryWithItems) => {
    if (!delivery.riderId || !delivery.deliveryTimestamp) {
        throw "Removing a possible undelivered item";
    }
    const archivedDelivery = await prisma.archivedDelivery.create({
        data: {
            id: delivery.id,
            EDD: delivery.EDD,
            AWB: delivery.AWB,
            customerId: delivery.customerId,
            riderId: delivery.riderId,
            deliveryTimestamp: delivery.deliveryTimestamp,
        },
    });

    const promises: Promise<boolean>[] = [];
    delivery.items.forEach((item) => {
        promises.push(
            new Promise((resolve, reject) => {
                prisma.archivedItem
                    .create({
                        data: {
                            id: item.id,
                            length: item.length,
                            breadth: item.breadth,
                            height: item.height,
                            weight: item.weight,
                            productId: item.productId,
                            deliveryId: archivedDelivery.id,
                        },
                    })
                    .then(() => resolve(true))
                    .catch(() => reject(false));
            })
        );

        promises.push(
            new Promise((resolve, reject) => {
                // Delete done items
                prisma.inventoryItem
                    .delete({
                        where: { id: item.id },
                    })
                    .then(() => resolve(true))
                    .catch(() => reject(false));
            })
        );
    });

    await Promise.all(promises);

    // Delete active record
    await prisma.delivery.delete({
        where: { id: delivery.id },
    });
};

const cascadeDeletePickup = async (pickup: Pickup) => {
    if (!pickup.riderId || !pickup.pickupTimestamp) {
        throw "Removing a possible unpickedup item";
    }
    await prisma.archivedPickup.create({
        data: {
            id: pickup.id,
            EDP: pickup.EDP,
            AWB: pickup.AWB,
            customerId: pickup.customerId,
            riderId: pickup.riderId,
            pickupTimestamp: pickup.pickupTimestamp,
            productId: pickup.productId,
        },
    });

    // Delete active record
    await prisma.pickup.delete({
        where: { id: pickup.id },
    });
};

// -------SUBMIT DELIVERY route----------
// * route_type: private/authorized
// * relative url: /rider/register-package
// * method: POST
// * status_codes_returned: 200
export const registerPackageSchema = z.object({
    body: z.object({
        itemId: z.string(),
        delivery: z.boolean(),
    }),
});
export const registerPackage = async (_req: Request, res: Response) => {
    const req = _req as RiderAuthorizedRequest;
    const { body } = _req as unknown as z.infer<typeof registerPackageSchema>;

    try {
        let item: Pickup | Delivery | null = null;
        if (body.delivery) {
            item = await prisma.delivery.findUnique({ where: { id: body.itemId } });
        } else {
            item = await prisma.pickup.findUnique({ where: { id: body.itemId } });
        }

        if (!item || item.riderId !== req.riderId)
            return res.status(404).json({ sucess: false, message: "Item not found!" });

        if (body.delivery) {
            const delivery = await prisma.delivery.update({
                where: { id: body.itemId },
                data: { deliveryTimestamp: new Date(Date.now()) },
                include: { items: true },
            });
            await cascadeDeleteDelivery(delivery);
        } else {
            const pickup = await prisma.pickup.update({
                where: { id: body.itemId },
                data: { pickupTimestamp: new Date(Date.now()) },
            });
            await cascadeDeletePickup(pickup);
        }

        return res.status(200).json({
            success: true,
            message: `${body.delivery ? "Delivery" : "Pickup"} recorded!`,
        });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const toggleOnduty = async (_req: Request, res: Response) => {
    const req = _req as RiderAuthorizedRequest;
    try {
        const riderQuery = await prisma.rider.findFirst({
            where: { id: req.riderId },
            select: { onduty: true },
        });
        if (!riderQuery) {
            return res.status(401).json({ success: false, message: "Expired authorization" });
        }
        const { onduty } = riderQuery;

        const rider = await prisma.rider.update({
            where: { id: req.riderId },
            data: { onduty: !onduty },
        });

        return res.status(200).json({
            success: true,
            message: "Updated onduty of rider",
            rider: serializeRider(rider),
        });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        return res.status(500).json({ succeess: false, message: "Internal Server Error" });
    }
};
