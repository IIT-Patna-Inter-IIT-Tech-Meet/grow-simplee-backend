import { prisma } from "./prisma";
import { routeRepository } from "./redis";
import { ItemAtom, RoutePoint, PackageAtom } from "./types";
import { client as redisClient } from "./redis";

export const assignRoutesToRiders = async (routes: ItemAtom[][]) => {
    try {
        const riders = await prisma.rider.findMany({
            where: { onduty: true },
            select: { id: true },
        });

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
                        shipped: true,
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

export const updateRiderRoute = async (riderId: string, packages: PackageAtom[]) => {
    try {
        const routeRepositoryId = await redisClient.get(`route:${riderId}`);

        if (!routeRepositoryId) {
            throw "Possible assignment to invalid rider";
        }

        const route = await routeRepository.fetch(routeRepositoryId);

        route.points = packages.map(({ latitude, longitude, id }) => {
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
        });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        throw e;
    }
};

export const updateMissedPackages = async (packages: PackageAtom[]) => {
    const deliverables = packages.filter(x => x.delivery);
    const pickupables = packages.filter(x => !x.delivery);

    try {
        deliverables.forEach(async (d) => {
            if (d.id === "root") return;
            await prisma.inventoryItem.update({
                where: { id: d.id },
                data: {
                    shipped: false
                }
            }).catch((e) => {
                console.log(e, d)
            })
        })

        pickupables.forEach(async (p) => {
            await prisma.pickup.update({
                where: { id: p.id },
                data: {
                    riderId: null,
                }
            }).catch((e) => {
                console.log(e, p)
            })

        })
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
    }
}
