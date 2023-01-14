import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { PrismaClient, Rider, BloodGroup } from "@prisma/client";
import * as bcrypt from 'bcrypt';

import { TOKEN_SECRET, __prod__ } from "../util/secret";


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

export const register = (_req: Request, _res: Response) => {

};

export const login = async (req: Request, res: Response) => {
    // Fields for login: req.body.email and req.body.password
    const { body } = req;
    if (!body || !body.email || !body.password) {
        return res.status(400).json({ success: false, message: "Malformed request" });
    }
    const { email, password } = req.body;


    try {
        const prisma = new PrismaClient();

        const rider = await prisma.rider.findUnique({ where: { email } });

        if (!rider) { 
            return res.status(402).json({ success: false, message: "Unauthorized" });
        }

        const result = await bcrypt.compare(password, rider.password);

        if (!result) {
            return res.status(402).json({ success: false, message: "Unauthorized" });
        }

        const token = jwt.sign({ id: rider.id }, TOKEN_SECRET);


        return res
        .cookie("jwt", token, {
            httpOnly: true,
            secure: __prod__,
        })
        .status(200)
        .json({ success: true, message: "Login Successful!", rider: serializeRider(rider) });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
};

export const logout = (_req: Request, _res: Response) => {};
export const forgot_password = (_req: Request, _res: Response) => {};
export const reset_password = (_req: Request, _res: Response) => {};
