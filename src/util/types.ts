import { Request } from "express";

export type RiderAuthorizedRequest = Request & { riderId: string };
export type AdminAuthorizedRequest = Request & { adminId: number };
export type SuperAdminAuthorizedRequest = AdminAuthorizedRequest;

export enum AUTH_PRIVILEDGE {
    SUPER_ADMIN,
    ADMIN,
    RIDER
}
