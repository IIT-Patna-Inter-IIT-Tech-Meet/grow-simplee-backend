import { Server } from "socket.io";
import { RiderSocket } from "../util/types";
import { client as redisClient, RiderGeolocation, riderRepository } from "../util/redis";

const getRiderRespository = async (key: string) => {
    let riderRepositoryId = await redisClient.get(key);
    if (!riderRepositoryId) {
        const riderEntity = riderRepository.createEntity({
            socketId: "<error>",
            id: "<error>",
            point: { latitude: 0, longitude: 0 },
        });
        riderRepositoryId = await riderRepository.save(riderEntity);

        await riderRepository.expire(riderRepositoryId, 24 * 60 * 60); // 1 day

        await redisClient.set(key, riderRepositoryId);
    }

    return { id: riderRepositoryId, rider: await riderRepository.fetch(riderRepositoryId) };
};

const saveAndAssertRider = async (
    riderEntity: RiderGeolocation,
    riderRepoId: string
): Promise<void> => {
    console.assert((await riderRepository.save(riderEntity)) === riderRepoId);
};

export const handleRiderConnection = async (io: Server, socket: RiderSocket) => {
    // update redis GIS
    const { id: riderRepoId, rider: riderEntity } = await getRiderRespository(
        `rider:${socket.riderId}`
    );
    riderEntity.id = socket.riderId;
    riderEntity.socketId = socket.id;
    riderEntity.point = { latitude: 0, longitude: 0 };

    await saveAndAssertRider(riderEntity, riderRepoId);

    socket.on("rider:move", async (latitude: number, longitude: number) => {
        try {
            riderEntity.point.latitude = latitude;
            riderEntity.point.longitude = longitude;

            await saveAndAssertRider(riderEntity, riderRepoId);

            // Inform all admins who are connected about the rider movement
            io.to("admin").emit("rider:move", riderEntity);
        } catch (e) {
            console.error(`[#] ERROR: ${e}`);
        }
    });
};
