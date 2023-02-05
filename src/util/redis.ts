import { Client, Entity, Point, Schema } from "redis-om";

import { REDIS_URL } from "../config/config";

export const client = await new Client().open(REDIS_URL);

// -----------Machine Repository-----------
interface Machine {
    isRecorded: boolean;

    length: number;
    breadth: number;
    height: number;

    weight: number;
}

class Machine extends Entity {}

const machineSchema = new Schema(Machine, {
    isRecorded: { type: "boolean" }, // Piyush has contributed

    length: { type: "number" },
    breadth: { type: "number" },
    height: { type: "number" },

    weight: { type: "number" },
});

export const machineRepository = client.fetchRepository(machineSchema);

await machineRepository.createIndex();

// -----------Rider Repository-----------
interface RiderGeolocation {
    id: string;
    socketId: string;
    point: Point;
}

class RiderGeolocation extends Entity {}

const riderSchema = new Schema(RiderGeolocation, {
    id: { type: "string" },
    socketId: { type: "string" },
    point: { type: "point" },
});

export const riderRepository = client.fetchRepository(riderSchema);

await riderRepository.createIndex();
