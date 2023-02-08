import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { serializeAdmin, serializeRider } from "../util/auth";
import { AdminAuthorizedRequest, AUTH_PRIVILEGE } from "../util/types";
import jwt from "jsonwebtoken";
import { COOKIE_CONFIG, TOKEN_SECRET } from "../config/config";

import { prisma } from "../util/prisma";
import { generateRoutes } from "../util/pathGenerator";
import { assignRoutesToRiders } from "../util/routes";

// ----------LOGIN route----------
// * route_type: public
// * relative url: /admin/login
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
        const admin = await prisma.admin.findUnique({ where: { email: email } });

        if (!admin) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const result = await bcrypt.compare(password, admin.password);

        if (!result) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                role: admin.superAdmin ? AUTH_PRIVILEGE.SUPER_ADMIN : AUTH_PRIVILEGE.ADMIN,
            },
            TOKEN_SECRET,
            {
                expiresIn: "10d", // expires the jwt after a period of 10 days
            }
        );

        return res
            .cookie("jwt", token, COOKIE_CONFIG)
            .status(200)
            .json({
                success: true,
                message: "Login Successful!",
                admin: serializeAdmin(admin),
            });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// ----------ADD RIDER route----------
// * route_type: private (admin-scoped)
// * relative url: /admin/add-rider
// * method: POST
// * status_codes_returned: 200, 400, 401, 500
export const addRiderSchema = z.object({
    body: z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
    }),
});
export const addRider = async (req: Request, res: Response) => {
    // Fields for register: Rider
    const { body } = req;

    const { name, phoneno, email, drivingLicense, bloodGroup, vehicleId } = body;

    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(body.password, salt);

        await prisma.rider.create({
            data: {
                id: uuidv4(),
                name,
                phoneno,
                password: hashedPassword,
                email,
                drivingLicense,
                bloodGroup,
                vehicleId,
                onduty: false,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Created Rider Successfully!",
        });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code.startsWith("P2"))
                return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (e instanceof Prisma.PrismaClientValidationError) {
            return res.status(400).json({ success: false, message: "Malformed body" });
        }
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// ----------ADD ADMIN route----------
// * route_type: private (super-admin-scoped)
// * relative url: /admin/add-admin
// * method: POST
// * status_codes_returned: 200, 400, 401, 500
export const addAdminSchema = z.object({
    body: z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
    }),
});
export const addAdmin = async (req: Request, res: Response) => {
    // Fields for register: Admin
    // model Admin {
    //   id         Int
    //   createdAt  DateTime
    //   updatedAt  DateTime
    //   name       String
    //   email      String
    //   password   String
    //   superAdmin Boolean
    // }
    const { body } = req;

    const { name, email, password } = body;

    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        await prisma.admin.create({
            data: {
                name,
                password: hashedPassword,
                email,
                superAdmin: false,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Created Admin Successfully!",
        });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code.startsWith("P2"))
                return res
                    .status(400)
                    .json({ success: false, message: "Couldn't insert into database" });
        }
        if (e instanceof Prisma.PrismaClientValidationError) {
            return res.status(400).json({ success: false, message: "Malformed body" });
        }
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// ----------LOGOUT route----------
// * route_type: private/authorized
// * relative url: /admin/logout
// * method: POST
// * cookies: UNSETS 'jwt'
// * status_codes_returned: 200
export const logout = (_: Request, res: Response) => {
    return res
        .clearCookie("jwt")
        .status(200)
        .json({ success: true, message: "Logged out successfully!" });
};

// ----------GET-ADMIN route----------
// * route_type: private/authorized
// * relative url: /admin/get-admin
// * method: GET
// * status_codes_returned: 200
export const getAdmin = async (_req: Request, res: Response) => {
    const req = _req as AdminAuthorizedRequest;

    const admin = await prisma.admin.findUnique({
        where: { id: req.adminId },
    });

    if (!admin) {
        return res.status(401).json({ success: false, message: "Unidentified Id" });
    }

    res.status(200).json({ success: true, message: "Valid Admin", admin: serializeAdmin(admin) });
};

// --------------------------------
// Rider queries
// --------------------------------
// model Rider {
//   id             String      @id @db.VarChar(50)
//   name           String      @db.VarChar(100)
//   phoneno        String?     @db.VarChar(20)
//   onduty         Boolean
//   vehicleId      String?     @db.VarChar(20)
//   email          String      @unique @db.VarChar(50)
//   password       String      @db.VarChar(80)
//   drivingLicense String?     @map("driving_license")
//   bloodGroup     BloodGroup? @map("blood_group")
// }

export const getRiderSchema = z.object({
    query: z.object({
        id: z.string(),
    }),
});
export const getRider = async (_req: Request, res: Response) => {
    const { query } = _req as unknown as z.infer<typeof getRiderSchema>;

    const rider = await prisma.rider.findUnique({
        where: { id: query.id },
    });

    if (!rider) {
        return res.status(400).json({ success: false, message: "Rider not found!" });
    }

    res.status(200).json({ success: true, message: "Rider found!", rider: serializeRider(rider) });
};

export const getAllRiders = async (_: Request, res: Response) => {
    const riders = await prisma.rider.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            phoneno: true,
            vehicleId: true,
            onduty: true,
        },
    });

    return res
        .status(200)
        .json({ success: true, message: `Found ${riders.length} rider(s)`, riders });
};

export const getRidersWithFilters = async (req: Request, res: Response) => {
    const { body } = req;
    if (!body) {
        return res.status(400).json({ success: false, message: "use /get-all-riders instead" });
    }

    if (body.id) {
        return res.status(400).json({ success: false, message: "use /get-rider instead" });
    }

    const filterPayload = [];
    const stringFields = ["name", "email", "phoneno", "vehicleId"];

    /*
     * name: string
     * email: string
     * phoneno: string
     * vehicleId: string
     * onduty: boolean
     */

    for (const field of stringFields) {
        if (typeof body[field] === "string" || body[field] instanceof String) {
            const value = body[field] as string;
            filterPayload.push({ [field]: { startsWith: value } });
        }
    }

    if (typeof body.onduty === "boolean") filterPayload.push({ onduty: body.onduty as boolean });

    const riders = await prisma.rider.findMany({
        where: { AND: filterPayload },
        select: {
            id: true,
            name: true,
            phoneno: true,
            email: true,
            onduty: true,
            vehicleId: true,
            bloodGroup: true,
            drivingLicense: true,
        },
    });

    return res
        .status(200)
        .json({ success: true, message: `Found ${riders.length} rider(s)`, riders });
};

// type ItemAtom = {
//     latitude: number;
//     longitude: number;
//     id: string;
//     edd: Date;
//     volume: number;
// };
export const formRoutes = async (_: Request, res: Response) => {
    // remove the deliveryTimestamp ones from inventoryItem first
    try {
        const startOfNextDay = new Date();
        startOfNextDay.setUTCHours(0, 0, 0, 0);
        startOfNextDay.setDate(startOfNextDay.getDate() + 1);

        const packages = await prisma.inventoryItem.findMany({
            select: {
                id: true,
                length: true,
                breadth: true,
                height: true,
                delivery: {
                    select: {
                        customer: {
                            select: {
                                latitude: true,
                                longitude: true,
                            },
                        },
                        EDD: true,
                    },
                },
            },
        });

        const riderCount = await prisma.rider.count({
            where: { onduty: true },
        });
        const routePackages = packages.map((p) => {
            return {
                id: p.id,
                latitude: p.delivery.customer.latitude,
                longitude: p.delivery.customer.longitude,
                edd: p.delivery.EDD,
                volume: p.length * p.breadth * p.height,
            };
        });

        const routes = await generateRoutes(routePackages, riderCount);
        await assignRoutesToRiders(routes);

        return res
            .status(200)
            .json({ success: true, message: `Generated ${routes.length} routes!` });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
