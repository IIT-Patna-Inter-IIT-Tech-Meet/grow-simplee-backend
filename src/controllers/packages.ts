import { Request, Response } from "express";

import { client as redisClient, machineRepository } from "../util/redis";

export const addPackage = (_req: Request, _res: Response) => {
    // : TODO : create api with light authorization to work with IOT
    // : TODO : handle IOT request to add the product in inventory
};

export const getPackage = (_req: Request, _res: Response) => {
    // : TODO : API for serving data to admin panel with pagination
};

export const getPackageWithFilter = (_req: Request, _res: Response) => {
    // : TODO : API for serving data to admin panel with pagination and filter
};

export const recordDimensions = async (req: Request, res: Response) => {
    const { body } = req;
    if (!body || !body.machineId || !body.length || !body.breadth || !body.height || !body.weight) {
        return res.status(400).json({ success: false, message: "Malformed request" });
    }

    // NOTE: This might actually lead to some sort of SQL Injection or not?
    let machineRepoId = await redisClient.get(body.machineId);

    console.log("Hello after get");
    if (!machineRepoId) {
        const machine = machineRepository.createEntity({
            isRecorded: false,
            lenght: 0,
            breadth: 0,
            height: 0,
            weight: 0,
        });

        machineRepoId = await machineRepository.save(machine);
        console.log("Hello after first save");

        await machineRepository.expire(machineRepoId, 24 * 60 * 60); // 1 day

        await redisClient.set(body.machineId, machineRepoId);
        console.log("Hello after set");
    }

    const machine = await machineRepository.fetch(machineRepoId);
    console.log("Hello after fetch");

    if (machine.isRecorded) {
        return res.status(403).json({ success: false, message: "Unused data left on memory" });
    }

    machine.isRecorded = true;

    machine.length = body.length;
    machine.breadth = body.breadth;
    machine.height = body.height;

    machine.weight = body.weight;

    const newId = await machineRepository.save(machine);
    console.log("Hello after second save");

    // Assert to check if saving the repository doesn't change the key value
    console.assert(newId === machineRepoId);

    return res.status(200).json({ success: true, message: "machine repository updated" });
};
