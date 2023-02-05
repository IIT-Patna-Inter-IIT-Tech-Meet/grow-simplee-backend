import { Server } from "socket.io";
import { RiderSocket } from "../util/types";
import { client as redisClient, RiderGeolocation, riderRepository } from "../util/redis";

const getRiderRespository = async (riderId: string) => {
    let riderRepositoryId = await redisClient.get(riderId);
    if (!riderRepositoryId) {
        const riderEntity = riderRepository.createEntity();
        riderRepositoryId = await riderRepository.save(riderEntity);

        await riderRepository.expire(riderRepositoryId, 24 * 60 * 60); // 1 day

        await redisClient.set(riderId, riderRepositoryId);
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
    console.log("rider added");
    const { id: riderRepoId, rider: riderEntity } = await getRiderRespository(socket.riderId);
    riderEntity.id = socket.riderId;
    riderEntity.socketId = socket.id;

    await saveAndAssertRider(riderEntity, riderRepoId);

    socket.on("rider:move", async (latitude: number, longitude: number) => {
        riderEntity.point.latitude = latitude;
        riderEntity.point.longitude = longitude;

        await saveAndAssertRider(riderEntity, riderRepoId);

        // TODOOO: inform all admins who are connected
        io.to("admin").emit("rider:move", riderEntity);
    });
};
