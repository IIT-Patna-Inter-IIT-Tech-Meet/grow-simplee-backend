import { Request, Response } from "express";
import { LatLong, RiderAuthorizedRequest } from "../util/types";
import { client as redisClient, routeRepository } from "../util/redis";
import { z } from "zod";

export const getRiderRouteSchema = z.object({
    query: z.object({
        riderId: z.string(),
    }),
});
export const getRiderRoute = async (_req: Request, res: Response) => {
    const { query } = _req as unknown as z.infer<typeof getRiderRouteSchema>;

    try {
        const routeRepoId = await redisClient.get(`route:${query.riderId}`);
        if (!routeRepoId) {
            return res.status(404).json({ success: false, message: "Invalid or inactive rider!" });
        }

        const route = await routeRepository.fetch(routeRepoId);

        // Assumption: all the points are actually carefully jsonified points
        const points = route.points.map((pointString): LatLong => JSON.parse(pointString));

        return res
            .status(200)
            .json({ success: false, message: `${points.length} points route found!`, points });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        return res.status(500).json({ success: true, message: "Internal Server Error" });
    }
};

export const getRoute = async (_req: Request, res: Response) => {
    const req = _req as RiderAuthorizedRequest;

    try {
        const routeRepoId = await redisClient.get(`route:${req.riderId}`);
        if (!routeRepoId) {
            return res.status(404).json({ success: false, message: "Invalid or inactive rider!" });
        }

        const route = await routeRepository.fetch(routeRepoId);

        // Assumption: all the points are actually carefully jsonified points
        const points = route.points.map((pointString): LatLong => JSON.parse(pointString));

        return res
            .status(200)
            .json({ success: false, message: `${points.length} point route found!`, points });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        return res.status(500).json({ success: true, message: "Internal Server Error" });
    }
};

export const getAllRoutes = async (_: Request, res: Response) => {
    const routesEntities = await routeRepository.search().return.all();
    const routes = routesEntities.map((routeEntity) => {
        return {
            // Assumption: all the points are actually carefully jsonified points
            points: routeEntity.points.map((pointString): LatLong => JSON.parse(pointString)),
            riderId: routeEntity.riderId,
        };
    });

    return res
        .status(200)
        .json({ success: true, message: `Found ${routes.length} routes`, routes });
};
