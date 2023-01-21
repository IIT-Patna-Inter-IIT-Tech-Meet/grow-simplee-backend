import { Request } from "express";
import { Rider, Admin } from "@prisma/client";

export type RiderAuthorizedRequest = Request & { riderId: string };
export type AdminAuthorizedRequest = Request & { adminId: number };
export type SuperAdminAuthorizedRequest = AdminAuthorizedRequest;

export enum AUTH_PRIVILEDGE {
    SUPER_ADMIN,
    ADMIN,
    RIDER,
    ALL,
}

export type SerializedRider = Pick<
    Rider,
    "name" | "email" | "phoneno" | "onduty" | "drivingLicense" | "bloodGroup"
> &
    Partial<Rider>;

export type SerializedAdmin = Pick<Admin, "name" | "email" | "superAdmin"> & Partial<Admin>;
