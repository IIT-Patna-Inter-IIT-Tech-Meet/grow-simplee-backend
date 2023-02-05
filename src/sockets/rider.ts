import { Server } from "socket.io";
import { RiderSocket } from "../util/types";
import { client as redisClient, riderRepository } from "../util/redis";

const getRiderRespository = async (riderId: string) => {
    let riderRepositoryId = await redisClient.get(riderId);
    if (!riderRepositoryId) {
        const riderEntity = riderRepository.createEntity();
        riderRepositoryId = await riderRepository.save(riderEntity);

        await riderRepository.expire(riderRepositoryId, 24 * 60 * 60); // 1 day

        await redisClient.set(riderId, riderRepositoryId);
    }

    return await riderRepository.fetch(riderRepositoryId);
};

export const handleRiderConnection = async (io: Server, socket: RiderSocket) => {
    // update redis GIS
    const riderEntity = await getRiderRespository(socket.riderId);
};
