import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { PrismaClient, Prisma, Rider } from "@prisma/client";
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { COOKIE_CONFIG, TOKEN_SECRET, __prod__ } from "../util/secret";
import { RiderAuthorisedRequest } from "../util/types";

const prisma = new PrismaClient();

type SerializedRider = {
    name: Rider["name"],
    phoneno: Rider["phoneno"],
    onduty: Rider["onduty"],
    email: Rider["email"],
    drivingLicense: Rider["drivingLicense"],
    bloodGroup: Rider["bloodGroup"],
};

const serializeRider = (rider: Rider): SerializedRider => {
    const { name, phoneno, onduty, email, drivingLicense, bloodGroup } = rider;
    return { name, phoneno, onduty, email, drivingLicense, bloodGroup };
}

// ----------REGISTER route----------
// * route_type: public
// * relative url: /auth/register
// * method: POST
// * cookies: SETS 'jwt'
// * status_codes_returned: 200, 400, 401, 500
export const register = async (req: Request, res: Response) => {
    // Fields for register: Rider
    const { body } = req;
    if (!body || !body.name || !body.email || !body.password) {
        return res.status(400).json({ success: false, message: "Malformed request" });
    }

    const { name, phoneno, email, drivingLicense, bloodGroup } = body;
    
    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(body.password, salt);

        const rider = await prisma.rider.create({
            data: {
                id: uuidv4(),
                name,
                phoneno,
                password: hashedPassword,
                email,
                drivingLicense,
                bloodGroup,
                onduty: false
            }
        });

        const token = jwt.sign({ id: rider.id }, TOKEN_SECRET);

        return res
        .cookie("jwt", token, COOKIE_CONFIG)
        .status(200)
        .json({
            success: true, 
            message: "Registration Successful!", 
            rider: serializeRider(rider)
        });
    }  catch (e) {
        console.error(`[#] ERROR: ${e}`);
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code.startsWith('P2'))
                return res.status(401).json({ success: false, message: "Unauthorized" });
            return res.status(500).json({ success: false, message: "Internal Server Error" })
        }
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
};

// ----------LOGIN route----------
// * route_type: public
// * relative url: /auth/login
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

        const token = jwt.sign({ id: rider.id }, TOKEN_SECRET);

        return res
        .cookie("jwt", token, COOKIE_CONFIG)
        .status(200)
        .json({
            success: true, 
            message: "Login Successful!", 
            rider: serializeRider(rider)
        });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
};

// ----------LOGOUT route----------
// * route_type: private/authorized
// * relative url: /auth/logout
// * method: POST
// * cookies: SETS 'jwt'
// * status_codes_returned: 200
export const logout = (_: Request, res: Response) => {
    return res
        .clearCookie("jwt")
        .status(200)
        .json({ success: true, message: "Logged out successfully!" });
};

// ----------FORGOT PASSWORD route----------
// * route_type: public
// * relative url: /auth/forgot-password
// * method: POST
// * cookies: SETS 'jwt'
// * status_codes_returned: 200
export const forgotPassword = (_req: Request, _res: Response) => {};


// ----------RESET PASSWORD route----------
// * route_type: public
// * relative url: /auth/reset-password
// * method: POST
// * cookies: SETS 'jwt'
// * status_codes_returned: 200
export const resetPassword = (_req: Request, _res: Response) => {};
