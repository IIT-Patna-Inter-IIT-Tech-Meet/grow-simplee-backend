import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import { PrismaClient, Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { serializeAdmin } from "../util/auth";
import { AdminAuthorizedRequest, AUTH_PRIVILEGE } from "../util/types";
import jwt from "jsonwebtoken";
import { COOKIE_CONFIG, TOKEN_SECRET } from "../util/config";

const prisma = new PrismaClient();

// ----------LOGIN route----------
// * route_type: public
// * relative url: /admin/login
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
export const addRider = async (req: Request, res: Response) => {
    // Fields for register: Rider
    const { body } = req;
    if (!body || !body.name || !body.email || !body.password) {
        return res.status(400).json({ success: false, message: "Malformed request" });
    }

    const { name, phoneno, email, drivingLicense, bloodGroup } = body;

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
    if (!body || !body.name || !body.email || !body.password) {
        return res.status(400).json({ success: false, message: "Malformed request" });
    }

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
