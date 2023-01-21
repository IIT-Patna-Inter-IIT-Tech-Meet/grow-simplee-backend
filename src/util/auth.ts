import { Rider, Admin } from "@prisma/client";
import { SerializedAdmin, SerializedRider } from "./types";

const DIGITS = "0123456789";
export const generateOTP = (length: number): string => {
    let otp = "";
    for (let i = 0; i < length; ++i) {
        otp += DIGITS[Math.floor(Math.random() * 10)];
    }
    return otp;
};

export const serializeRider = (rider: Rider): SerializedRider => {
    const { name, phoneno, onduty, email, drivingLicense, bloodGroup } = rider;
    return { name, phoneno, onduty, email, drivingLicense, bloodGroup };
};

export const serializeAdmin = (admin: Admin): SerializedAdmin => {
    const { name, email, superAdmin } = admin;
    return { name, email, superAdmin };
};
