import { createClient } from "redis";
import { Client, Entity, Point, Schema } from "redis-om";

import { REDIS_URL } from "../config/config";

export const redis = createClient({ url: REDIS_URL });
await redis.connect();
export const client = await new Client().use(redis);

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
export interface RiderGeolocation {
    id: string;
    socketId: string;
    point: Point;
}

export class RiderGeolocation extends Entity {}

const riderSchema = new Schema(RiderGeolocation, {
    id: { type: "string" },
    socketId: { type: "string" },
    point: { type: "point" },
});

export const riderRepository = client.fetchRepository(riderSchema);

await riderRepository.createIndex();

// --------------Routes Repository-----------
// DANGER: JSON stringifying the point
export interface Routes {
    riderId: string;
    points: string[];
}

export class Routes extends Entity {}

const routesSchema = new Schema(Routes, {
    riderId: { type: "string" },
    points: { type: "string[]" },
});

export const routeRepository = client.fetchRepository(routesSchema);

await routeRepository.createIndex();
