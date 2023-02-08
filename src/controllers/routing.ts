import { Request, Response } from "express";
import { RoutePoint, RiderAuthorizedRequest } from "../util/types";
import { client as redisClient, routeRepository, Routes } from "../util/redis";
import { z } from "zod";
import { Feature, FeatureCollection, LineString } from "geojson";
import fs from "fs";
import { prisma } from "../util/prisma";
import json2csv from "json2csv";

export const fetchPointsFromRoute = (route: Routes) => {
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

const makeFeatureCollectionFromRoutes = (routes: Routes[]) => {
    const features = routes.map((route) => {
        const lineString: LineString = {
            type: "LineString",
            coordinates: route.points.map((point) => {
                const pointGJ = JSON.parse(point) as RoutePoint;
                return [...pointGJ.geometry.coordinates];
            }),
        };
        const feature: Feature<LineString> = {
            type: "Feature",
            geometry: lineString,
            properties: {
                riderId: route.riderId,
            },
        };
        return feature;
    });
    const featureCollection: FeatureCollection = {
        type: "FeatureCollection",
        features: features,
    };

    return featureCollection;
};

const formRouteGeoJSON = async () => {
    const routesEntities = await routeRepository.search().return.all();
    const routesGJ = makeFeatureCollectionFromRoutes(routesEntities);

    fs.writeFileSync("routes.json", JSON.stringify(routesGJ));
};

type Data = {
    SKU: string;
    AWB: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    riderId: string;
    vehicleId: string;
};
const formCSV = async () => {
    const routesEntities = await routeRepository.search().return.all();
    const finalData: Data[] = [];
    const promises: Promise<boolean>[] = [];
    routesEntities.forEach((route) => {
        route.points.forEach((point) => {
            promises.push(
                new Promise((resolve, reject) => {
                    const j = JSON.parse(point) as RoutePoint;
                    prisma.inventoryItem
                        .findUnique({
                            where: { id: j.properties.itemId },
                            select: {
                                product: {
                                    select: {
                                        SKU: true,
                                    },
                                },
                                delivery: {
                                    select: {
                                        AWB: true,
                                        customer: {
                                            select: {
                                                latitude: true,
                                                longitude: true,
                                                address: true,
                                                name: true,
                                            },
                                        },
                                        rider: {
                                            select: {
                                                id: true,
                                                vehicleId: true,
                                            },
                                        },
                                    },
                                },
                            },
                        })
                        .then((data) => {
                            finalData.push({
                                SKU: data?.product.SKU || "",
                                AWB: data?.delivery.AWB || "",
                                name: data?.delivery.customer.name || "",
                                address: data?.delivery.customer.address || "",
                                latitude: data?.delivery.customer.latitude || 0,
                                longitude: data?.delivery.customer.longitude || 0,
                                riderId: data?.delivery.rider?.id || "",
                                vehicleId: data?.delivery.rider?.vehicleId || "",
                            });
                            resolve(true);
                        })
                        .catch(() => {
                            reject(false);
                        });
                })
            );
        });
    });
    await Promise.all(promises);
    const csvData = json2csv.parse(finalData);

    fs.writeFileSync("final-data.csv", csvData);
};

export const generateStats = async (_: Request, res: Response) => {
    await formRouteGeoJSON();
    await formCSV();

    return res.status(200).json({ sucess: true, message: "formed data." });
};
