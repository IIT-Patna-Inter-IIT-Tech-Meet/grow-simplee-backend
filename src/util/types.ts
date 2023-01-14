import { Request } from "express";

export type RiderAuthorisedRequest = Request & { riderId: string }
