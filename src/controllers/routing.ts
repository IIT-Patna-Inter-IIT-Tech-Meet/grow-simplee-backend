import { Request, Response } from "express";
import { RoutePoint, RiderAuthorizedRequest } from "../util/types";
import { client as redisClient, routeRepository, Routes } from "../util/redis";
import { z } from "zod";

const fetchPointsFromRoute = (route: Routes) => {
    // Assumption: all the points are actually carefully jsonified points
    return route.points.map((pointString) => {
        const geojson: RoutePoint = JSON.parse(pointString);

        return {
            latitude: geojson.geometry.coordinates[0],
            longitude: geojson.geometry.coordinates[1],
            itemId: geojson.properties.itemId,
            delivery: geojson.properties.delivery,
        };
    });
};

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

        const points = fetchPointsFromRoute(route);

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

        const points = fetchPointsFromRoute(route);

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
            points: fetchPointsFromRoute(routeEntity),
            riderId: routeEntity.riderId,
        };
    });

    return res
        .status(200)
        .json({ success: true, message: `Found ${routes.length} routes`, routes });
};
