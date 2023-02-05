import { Request, Response } from "express";
import { LatLong, RiderAuthorizedRequest } from "../util/types";
import { client as redisClient, routeRepository } from "../util/redis"
import { z } from "zod";

export const getRiderRouteSchema = z.object({
    query: z.object({
        riderId: z.string() 
    })
})
export const getRiderRoute = async (_req: Request, res: Response) => {
    const { query } = _req as unknown as z.infer<typeof getRiderRouteSchema>;

    const routeRepoId = await redisClient.get(`route:${query.riderId}`)
    if (!routeRepoId) {
        return res.status(404).json({ success: false, message: "Invalid or inactive rider!" });
    }
    
    const route = await routeRepository.fetch(routeRepoId);
    // Assumption: all the points are actually carefully jsonified points

    const points = route.points.map((pointString): LatLong  => JSON.parse(pointString));

    res.status(200).json({ success: false})
};

export const getRoute = (_req: Request, res: Response) => {
    const req = _req as RiderAuthorizedRequest;
}

export const getAllRoutes = (_req: Request, res: Response) => {
    // TODO: Fetch all routes for admin
};
