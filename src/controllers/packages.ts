import { Request, Response } from "express";
import { prisma } from "../util/prisma";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { client as redisClient, machineRepository } from "../util/redis";
import { PackageDistAtom, PackageListAtom, RiderAuthorizedRequest } from "../util/types";
import { geocodeAddress } from "../util/maps";

export const addPackageSchema = z.object({
    body: z.object({
        machineId: z.string().startsWith("machine:", { message: "Must start with `machine:`" }),
        SKU: z.string(),
        productName: z.string(),
        desc: z.string().optional(),
        AWB: z.string(),
        EDD: z.string().datetime(),
        customerName: z.string(),
        address: z.string(),
        phoneno: z.string().optional(),
    }),
});
export const addPackage = async (_req: Request, res: Response) => {
    const req = _req as unknown as z.infer<typeof addPackageSchema>;
    const {
        body: { machineId, SKU, productName, desc, AWB, EDD, customerName, address, phoneno },
    } = req;
    // Requirements:
    // - machineId
    // - SKU
    // - productName
    // - AWB
    // - EDD
    // - customerName
    // - address

    const machineRepositoryId = await redisClient.get(machineId);
    if (!machineRepositoryId) {
        return res.status(403).json({ success: false, message: "Invalid machine ID" });
    }
    const machine = await machineRepository.fetch(machineRepositoryId);
    if (!machine || !machine.isRecorded) {
        return res.status(403).json({ success: false, message: "Machine has expired!" });
    }

    const { length, breadth, height, weight } = machine;

    try {
        // NOTE: as a new package is made, it should have a cascading effect
        // by creating:
        // - Product (if it already does not exist)
        // - Customer (if it already does not exist)
        // - Delivery
        const product = await prisma.product.upsert({
            where: { SKU },
            update: {},
            create: {
                SKU: SKU,
                name: productName,
                desc,
            },
        });

        // TODO: Verify
        const latLng = await geocodeAddress(address);

        const customer = await prisma.customer.upsert({
            where: { name_address: { name: customerName, address: address } },
            update: {},
            create: {
                name: customerName,
                address,
                phoneno,
                latitude: latLng.latitude.toString(),
                longitude: latLng.longitude.toString(),
            },
        });

        const delivery = await prisma.delivery.create({
            data: {
                id: uuidv4().substring(0, 20),
                AWB,
                EDD,
                customerId: customer.id,
            },
        });

        const inventoryItem = await prisma.inventoryItem.create({
            data: {
                id: uuidv4(),
                productId: product.SKU,
                length,
                breadth,
                height,
                weight,
                shipped: false,
                deliveryId: delivery.id,
            },
        });

        // make the machine readable again
        machine.isRecorded = false;
        const newId = await machineRepository.save(machine);

        console.assert(newId === machineRepositoryId);

        res.status(200).json({ success: true, message: "Added Package", package: inventoryItem });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const addPickupSchema = z.object({
    body: z.object({
        SKU: z.string(),
        productName: z.string(),
        desc: z.string().optional(),
        AWB: z.string(),
        EDP: z.string().datetime(),
        customerName: z.string(),
        address: z.string(),
        phoneno: z.string().optional(),
    }),
});
export const addPickup = async (req: Request, res: Response) => {
    const {
        body: { AWB, EDP, SKU, productName, desc, customerName, address, phoneno },
    } = req as unknown as z.infer<typeof addPickupSchema>;
    try {
        // Cascading effect:
        // - Product
        // - Customer
        // - Pickup
        const product = await prisma.product.upsert({
            where: { SKU },
            update: {},
            create: {
                SKU,
                name: productName,
                desc,
            },
        });

        const latLng = await geocodeAddress(address);

        const customer = await prisma.customer.upsert({
            where: { name_address: { name: customerName, address } },
            update: {},
            create: {
                name: customerName,
                address,
                phoneno,
                latitude: latLng.latitude.toString(),
                longitude: latLng.longitude.toString(),
            },
        });

        const pickup = await prisma.pickup.create({
            data: {
                id: uuidv4().substring(0, 20),
                AWB,
                EDP,
                customerId: customer.id,
                productId: product.SKU,
            },
        });

        return res.status(200).json({ success: true, message: "Recorded 1 pickup!", pickup });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getPackageSchema = z.object({
    query: z.object({
        id: z.string(),
    }),
});
export const getPackage = async (_req: Request, res: Response) => {
    const { query } = _req as unknown as z.infer<typeof getPackageSchema>;

    try {
        const item = await prisma.inventoryItem.findUnique({
            where: { id: query.id },
            include: { product: true, delivery: { include: { customer: true, rider: true } } },
        });

        if (!item) {
            return res.status(404).json({ success: false, message: "Not Found" });
        }

        res.status(200).json({ success: true, message: "Found 1 package", package: item });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getPackagesWithFilterSchema = z.object({
    body: z.object({
        outForDelivery: z.boolean().optional(),
        eddStart: z
            .string()
            .datetime()
            .default(new Date(Date.now() - 5 * 7 * 24 * 60 * 60 * 1000).toJSON()), // 5 weeks
        eddEnd: z
            .string()
            .datetime()
            .default(new Date(Date.now() + 5 * 7 * 24 * 60 * 60 * 1000).toJSON()), // 5 weeks
        delivered: z.boolean().default(false),
        deliveryBefore: z.string().datetime().default(new Date(Date.now()).toJSON()),
        deliveryAfter: z
            .string()
            .datetime()
            .default(new Date(Date.now() - 5 * 7 * 24 * 60 * 60 * 1000).toJSON()), // 5 weeks
        page: z.number().gte(0).default(1),
        limit: z.number().gte(0).lte(20).default(20),
    }),
});
export const getPackagesWithFilter = async (_req: Request, res: Response) => {
    const req = _req as unknown as z.infer<typeof getPackagesWithFilterSchema>;
    // Fields expected:
    // - outForDelivery (=> shipped == true) (MORE PRIORITY THAN DELIVERY FIELDS)
    // - eddStart
    // - eddEnd
    // - delivered: boolean
    // - deliveryBefore:
    // - deliveryAfter:
    // - page:
    // - limit:
    // IF outForDelivery is set, then delivery* fields are ignored

    const { body } = await getPackagesWithFilterSchema.parseAsync(req);

    try {
        let items: PackageListAtom[] = [];
        if (typeof body.outForDelivery === "boolean" || !body.delivered) {
            items = await prisma.inventoryItem.findMany({
                skip: body.limit * (body.page - 1),
                take: body.limit,
                where: {
                    AND: [
                        { shipped: body.outForDelivery },
                        { delivery: { EDD: { lte: body.eddEnd, gte: body.eddStart } } },
                    ],
                },
                select: {
                    shipped: true,
                    id: true,
                    product: {
                        select: {
                            name: true,
                            SKU: true,
                        },
                    },
                    delivery: {
                        select: {
                            EDD: true,
                            AWB: true,
                            customer: {
                                select: {
                                    name: true,
                                    address: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    delivery: {
                        EDD: "asc",
                    },
                },
            });
        } else {
            items = await prisma.archivedItem.findMany({
                skip: body.limit * (body.page - 1),
                take: body.limit,
                orderBy: {
                    delivery: {
                        deliveryTimestamp: "desc",
                    },
                },
                where: {
                    AND: [
                        { delivery: { deliveryTimestamp: { lte: body.deliveryBefore } } },
                        { delivery: { deliveryTimestamp: { gte: body.deliveryAfter } } },
                    ],
                },
                select: {
                    id: true,
                    product: {
                        select: {
                            name: true,
                            SKU: true,
                        },
                    },
                    delivery: {
                        select: {
                            EDD: true,
                            deliveryTimestamp: true,
                            AWB: true,
                            customer: {
                                select: {
                                    name: true,
                                    address: true,
                                },
                            },
                        },
                    },
                },
            });
        }

        return res
            .status(200)
            .json({ success: true, message: `Found ${items.length} package(s)`, packages: items });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);

        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getDimensionRecords = async (_: Request, res: Response) => {
    const machines = await machineRepository.search().return.all();

    return res.status(200).json({
        success: true,
        message: `Found ${machines.length} machine(s)`,
        machines,
    });
};

export const recordDimensionsSchema = z.object({
    body: z.object({
        length: z.number().gt(0),
        breadth: z.number().gt(0),
        height: z.number().gt(0),
        weight: z.number().gt(0),
        machineId: z.string().startsWith("machine:", { message: "Must start with `machine:`" }),
    }),
});
export const recordDimensions = async (req: Request, res: Response) => {
    const { body } = req;

    // NOTE: This might actually lead to some sort of SQL Injection or not?
    let machineRepoId = await redisClient.get(body.machineId);

    if (!machineRepoId) {
        const machine = machineRepository.createEntity({
            isRecorded: false,
            length: 0,
            breadth: 0,
            height: 0,
            weight: 0,
        });

        machineRepoId = await machineRepository.save(machine);

        await machineRepository.expire(machineRepoId, 24 * 60 * 60); // 1 day

        await redisClient.set(body.machineId, machineRepoId);
    }

    const machine = await machineRepository.fetch(machineRepoId);

    if (machine.isRecorded) {
        return res.status(403).json({ success: false, message: "Unused data left on memory" });
    }

    machine.isRecorded = true;

    machine.length = body.length;
    machine.breadth = body.breadth;
    machine.height = body.height;

    machine.weight = body.weight;

    const newId = await machineRepository.save(machine);

    // Assert to check if saving the repository doesn't change the key value
    console.assert(newId === machineRepoId);

    return res.status(200).json({ success: true, message: "machine repository updated" });
};

const getPickupAndDeliveries = async (riderId: string): Promise<PackageDistAtom[]> => {
    const items: PackageDistAtom[] = [];
    const deliveries = await prisma.delivery.findMany({
        where: { riderId },
        select: {
            id: true,
            AWB: true,
            EDD: true,
            deliveryTimestamp: true,
            customer: {
                select: {
                    name: true,
                    address: true,
                    latitude: true,
                    longitude: true,
                },
            },
        },
        orderBy: { EDD: "desc" },
    });

    items.concat(deliveries.map((delivery) => ({ ...delivery, delivery: true })));

    const pickups = await prisma.pickup.findMany({
        where: { riderId },
        select: {
            id: true,
            AWB: true,
            EDP: true,
            pickupTimestamp: true,
            customer: {
                select: {
                    name: true,
                    address: true,
                    latitude: true,
                    longitude: true,
                },
            },
        },
        orderBy: { EDP: "desc" },
    });

    items.concat(pickups.map((pickup) => ({ ...pickup, delivery: false })));

    return items;
};

export const getRoutePackages = async (_req: Request, res: Response) => {
    const req = _req as RiderAuthorizedRequest;

    try {
        const packages = await getPickupAndDeliveries(req.riderId);

        res.status(200).json({
            success: true,
            message: `Found ${packages.length} packages`,
            packages: packages,
        });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getRiderPackagesSchema = z.object({
    query: z.object({
        riderId: z.string(),
    }),
});
export const getRiderPackages = async (req: Request, res: Response) => {
    const { query } = req as unknown as z.infer<typeof getRiderPackagesSchema>;

    try {
        const packages = await getPickupAndDeliveries(query.riderId);

        res.status(200).json({
            success: true,
            message: `Found ${packages.length} packages`,
            packages: packages,
        });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
