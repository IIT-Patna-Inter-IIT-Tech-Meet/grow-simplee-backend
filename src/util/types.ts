import { Request } from "express";
import { Rider, Admin } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { Feature, Point } from "geojson";

export type RiderAuthorizedRequest = Request & { riderId: string };
export type AdminAuthorizedRequest = Request & { adminId: number };
export type SuperAdminAuthorizedRequest = AdminAuthorizedRequest;

export enum AUTH_PRIVILEGE {
    SUPER_ADMIN,
    ADMIN,
    RIDER,
    ALL,
}

export type UserSocket = Socket & { role: AUTH_PRIVILEGE };
export type AdminSocket = Socket & { adminId: number };
export type RiderSocket = Socket & { riderId: string };

export type IORequest = Request & { io: Server };

export type SerializedRider = Pick<
    Rider,
    "name" | "email" | "phoneno" | "onduty" | "drivingLicense" | "bloodGroup" | "vehicleId"
> &
    Partial<Rider>;

export type SerializedAdmin = Pick<Admin, "name" | "email" | "superAdmin"> & Partial<Admin>;

export type PackageListAtom = {
    shipped?: boolean;
    id: string;
    product: {
        name: string;
        SKU: string;
    };
    delivery: {
        EDD: Date;
        dateTimestamp?: Date;
        AWB: string;
        customer: {
            name: string;
            address: string;
        };
    } | null;
};

export type DeliveryAtom = {
    id: string;
    AWB: string;
    EDD: Date;
    deliveryTimestamp: Date | null;
    customer: {
        name: string;
        address: string;
        latitude: number;
        longitude: number;
    };
};

export type PickupAtom = {
    id: string;
    AWB: string;
    EDP: Date;
    pickupTimestamp: Date | null;
    customer: {
        address: string;
        name: string;
        latitude: number;
        longitude: number;
    };
};

export type PackageDistAtom = (PickupAtom | DeliveryAtom) & {
    delivery: boolean;
};

export type LatLong = {
    latitude: number;
    longitude: number;
};

export type RoutePoint = Feature<Point> & {
    properties: {
        itemId: string;
        delivery: boolean;
    };
};

export type Matrix = {
    distanceMatrix: Array<Array<number>>;
    timeMatrix: Array<Array<number>>;
};

export type ItemAtom = {
    latitude: number;
    longitude: number;
    id: string; // inventory item | Pickup item
    edd: Date;
    volume: number;
};

export type PackageAtom = ItemAtom & {
    delivery: boolean;
};
