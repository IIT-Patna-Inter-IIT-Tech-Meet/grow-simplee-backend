import { prisma } from "./prisma";
import { routeRepository } from "./redis";
import { ItemAtom } from "./types";
import { client as redisClient } from "./redis";

export const assignRoutesToRiders = async (routes: ItemAtom[][]) => {
    try {
        const riders = await prisma.rider.findMany({
            where: { onduty: true },
            select: { id: true },
        });

        console.assert(riders.length === routes.length);

        riders.forEach(async (rider, idx) => {
            if (routes[idx].length <= 0) return;
            const route = routeRepository.createEntity({
                riderId: rider.id,
                points: routes[idx].map(({ latitude, longitude, id }) =>
                    JSON.stringify({
                        latitude,
                        longitude,
                        itemId: id,
                        delivery: true,
                    })
                ),
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
        });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        throw e;
    }
};