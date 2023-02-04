import { Request, Response } from "express";
import { prisma } from "../util/prisma";
import { v4 as uuidv4 } from "uuid";

import { client as redisClient, machineRepository } from "../util/redis";

export const addPackage = async (req: Request, res: Response) => {
    const { body } = req;
    if (!body || !body.machineId || !body.SKU || !body.productName) {
        return res.status(400).json({ success: false, message: "Malformed request" });
    }

    const { machineId, SKU, productName, desc } = body;

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
        const product = await prisma.product.upsert({
            where: { SKU },
            update: {},
            create: {
                SKU: SKU,
                name: productName,
                desc,
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
            },
        });

        res.status(200).json({ success: true, message: "Added Package", package: inventoryItem });
    } catch (e) {
        console.error(`[#] ERROR: ${e}`);
    }
};

export const getPackage = (_req: Request, _res: Response) => {
    // : TODO : API for serving data to admin panel with pagination
};

export const getPackageWithFilter = (_req: Request, _res: Response) => {
    // : TODO : API for serving data to admin panel with pagination and filter
};

export const getDimensionRecords = async (_: Request, res: Response) => {
    const machines = await machineRepository.search().return.all();

    return res.status(200).json({
        success: true,
        message: `Found ${machines.length} machine(s)`,
        machines,
    });
};

export const recordDimensions = async (req: Request, res: Response) => {
    const { body } = req;
    if (!body || !body.machineId || !body.length || !body.breadth || !body.height || !body.weight) {
        return res.status(400).json({ success: false, message: "Malformed request" });
    }

    // NOTE: This might actually lead to some sort of SQL Injection or not?
    let machineRepoId = await redisClient.get(body.machineId);

    if (!machineRepoId) {
        const machine = machineRepository.createEntity({
            isRecorded: false,
            lenght: 0,
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
