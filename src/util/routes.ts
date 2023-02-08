import { prisma } from "./prisma";
import { routeRepository } from "./redis";
import { ItemAtom, RoutePoint } from "./types";
import { client as redisClient } from "./redis";

export const assignRoutesToRiders = async (routes: ItemAtom[][]) => {
    try {
        const riders = await prisma.rider.findMany({
            where: { onduty: true },
            select: { id: true },
        });

        await redisClient.set("last-assignment", Date.now().toString());

        console.assert(riders.length === routes.length);

        riders.forEach(async (rider, idx) => {
            const route = routeRepository.createEntity({
                riderId: rider.id,
                points: routes[idx].map(({ latitude, longitude, id }) => {
                    const feature: RoutePoint = {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [latitude, longitude],
                        },
                        properties: {
                            itemId: id,
                            delivery: true,
                        },
                    };
                    return JSON.stringify(feature);
                }),
            });

            routes[idx].forEach(async ({ id: itemId }) => {
                await prisma.inventoryItem.update({
                    where: { id: itemId },
                    data: {
                        delivery: { update: { riderId: rider.id } },
                    },
                });
            });

            const routeRepositoryId = await routeRepository.save(route);

            await redisClient.set(`route:${rider.id}`, routeRepositoryId);

            await routeRepository.expire(routeRepositoryId, 24 * 60 * 60); // 1 day
            await redisClient.expire(`route:${rider.id}`, 24 * 60 * 60); // 1 day
        });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        throw e;
    }
};
